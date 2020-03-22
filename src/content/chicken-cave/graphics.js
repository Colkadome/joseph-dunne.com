'use strict';
/*
  graphics.js
*/

class _Graphics {

  constructor(canvasEl, opts) {

    this.canvasEl = canvasEl;
    this._logger = (opts && opts.logger) || null;

    this._gl = null;
    this.cameraX = 0;
    this.cameraY = 0;
    this.lastCameraX = 0;
    this.lastCameraY = 0;
    this.imageMap = new Map();
  }

  init() {

    // Check if already initialised.
    if (this._gl != null) {
      return this;
    }

    this.cameraX = 0;
    this.cameraY = 0;

    // Check if WebGL is supported.
    const gl = this.canvasEl.getContext('webgl');
    if (gl === null) {
      throw new Error('Unable to initialize WebGL.');
    }
    this._gl = gl;

    // Create buffers.
    this._quadBuffer = this._createBuffer(new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]));

    // Create framebuffers.
    this._fadeFramebuffer = gl.createFramebuffer();

    // Create textures.
    this._fadeTextureFront = this._createTexture(gl.canvas.width, gl.canvas.height, null);
    this._fadeTextureBack = this._createTexture(gl.canvas.width, gl.canvas.height, null);

    // Create tile program.
    this._tileProgram = this._loadProgram(_Graphics.TILE_VERT, _Graphics.TILE_FRAG);
    this._tileProgram_AQuad = gl.getAttribLocation(this._tileProgram, 'a_quad');
    this._tileProgram_UCanvas = gl.getUniformLocation(this._tileProgram, 'u_canvas');
    this._tileProgram_UPos = gl.getUniformLocation(this._tileProgram, 'u_pos');
    this._tileProgram_USize = gl.getUniformLocation(this._tileProgram, 'u_size');
    this._tileProgram_UTexPos = gl.getUniformLocation(this._tileProgram, 'u_tex_pos');
    this._tileProgram_UTexSize = gl.getUniformLocation(this._tileProgram, 'u_tex_size');
    this._tileProgram_UTex = gl.getUniformLocation(this._tileProgram, 'u_tex');

    // Create point program.
    this._pointProgram = this._loadProgram(_Graphics.POINT_VERT, _Graphics.POINT_FRAG);
    this._pointProgram_AType = gl.getAttribLocation(this._pointProgram, 'a_type');
    this._pointProgram_APos = gl.getAttribLocation(this._pointProgram, 'a_pos');
    this._pointProgram_AVel = gl.getAttribLocation(this._pointProgram, 'a_vel');
    this._pointProgram_UCanvas = gl.getUniformLocation(this._pointProgram, 'u_canvas');
    this._pointProgram_UCamera = gl.getUniformLocation(this._pointProgram, 'u_camera');

    // Create fade program.
    this._fadeProgram = this._loadProgram(_Graphics.FADE_VERT, _Graphics.FADE_FRAG);
    this._fadeProgram_AQuad = gl.getAttribLocation(this._fadeProgram, 'a_quad');
    this._fadeProgram_UTex = gl.getUniformLocation(this._fadeProgram, 'u_tex');
    this._fadeProgram_USize = gl.getUniformLocation(this._fadeProgram, 'u_size');
    this._fadeProgram_UOffset = gl.getUniformLocation(this._fadeProgram, 'u_offset');

    // Create overlay program.
    this._overlayProgram = this._loadProgram(_Graphics.OVERLAY_VERT, _Graphics.OVERLAY_FRAG);
    this._overlayProgram_AQuad = gl.getAttribLocation(this._overlayProgram, 'a_quad');
    this._overlayProgram_UTex = gl.getUniformLocation(this._overlayProgram, 'u_tex');
    this._overlayProgram_USize = gl.getUniformLocation(this._overlayProgram, 'u_size');

    // Clear canvas.
    //gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);  // Don't need this, we're not in 3D.
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    return this;
  }

  destroy() {
    const gl = this._gl;

    // Destroy framebuffers.
    gl.deleteFramebuffer(this._fadeFramebuffer);

    // Destroy buffers.
    gl.deleteBuffer(this._quadBuffer);

    // Destroy programs.
    gl.deleteProgram(this._tileProgram);
    gl.deleteProgram(this._pointProgram);

    // Destroy textures.
    gl.deleteTexture(this._fadeTexture);
    for (let texture of this.imageMap.values()) {
      gl.deleteTexture(texture);
    }

    // Set canvas to 1x1.
    gl.canvas.width = 1;
    gl.canvas.height = 1;

    // Lose the context, if supported.
    const loseContextObj = gl.getExtension('WEBGL_lose_context');
    if (loseContextObj) {
      loseContextObj.loseContext();
    }

    // Free other stuff.
    this.imageMap.clear();
    this.imageMap = null;
  }

  /**
   * Loads a WebGL shader program
   * @arg {String} vertSource - vertex shader string.
   * @arg {String} fragSource - fragment shader string.
   */
  _loadProgram(vertSource, fragSource) {
    const gl = this._gl;

    // Create vertex shader.
    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertSource);
    gl.compileShader(vertShader);
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(vertShader));
    }

    // Create fragment shader.
    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragSource);
    gl.compileShader(fragShader);
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(fragShader));
    }

    // Create program.
    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program));
    }

    // Cleanup.
    gl.detachShader(program, vertShader);
    gl.detachShader(program, fragShader);
    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);

    // Return program ID.
    return program;
  }

  /**
   * Loads a WebGL texture.
   * NOTE: Assumes all textures have an alpha channel.
   * @arg {Number} w - width of texture.
   * @arg {Number} h - height of texture.
   */
  _createTexture(w, h, data) {
    const gl = this._gl;

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);  // CLAMP_TO_EDGE needed for non-power-of-2 textures.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

    return texture;
  }

  /**
   * Creates a WebGL buffer.
   * @arg {TypedArray} data - buffer data.
   */
  _createBuffer(data) {
    const gl = this._gl;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
  }

  /**
   * Loads an image and saves it as a WebGL texture.
   * @arg {String} src - URL to image.
   */
  _loadImage(src) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imgData = new Uint8Array(ctx.getImageData(0, 0, img.width, img.height).data.buffer);
      const texture = this._createTexture(img.width, img.height, imgData);
      this.imageMap.set(src, texture);
      if (this._logger) {
        this._logger('Loaded image:', src);
      }
    };
    img.onerror = () => {
      if (this._logger) {
        this._logger('Error loading image:', src);
      }
    };
    img.src = src;

    // Initially set 'src' to null to mark that it is loading.
    this.imageMap.set(src, null);
  }

  drawTileLazy(src, x, y, w, h, ux, uy, uw, uh, z) {
    const texture = this.imageMap.get(src);
    if (texture !== undefined) {
      if (texture !== null) {
        return this.drawTile(texture, x, y, w, h, ux, uy, uw, uh, z);
      } else {
        // Draw a generic loading tile here?
      }
    } else {
      this._loadImage(src);
    }
    return false;
  }

  getCameraBounds() {
    return {
      x: this.cameraX,
      y: this.cameraY,
      w: this._gl.canvas.width,
      h: this._gl.canvas.height,
    };
  }

  putIntoView(x, y) {
    const gl = this._gl;

    // Scroll X position into view.
    const borderX = 160;
    const leftX = x - borderX;
    if (leftX < this.cameraX) {
      this.cameraX = leftX;
    } else {
      const rightX = x - gl.canvas.width + borderX;
      if (rightX > this.cameraX) {
        this.cameraX = rightX;
      }
    }

    // Scroll Y position into view.
    const borderY = 96;
    const bottomY = y - borderY;
    if (bottomY < this.cameraY) {
      this.cameraY = bottomY;
    } else {
      const topY = y - gl.canvas.height + borderY;
      if (topY > this.cameraY) {
        this.cameraY = topY;
      }
    }
  }

  beforeDraw() {
    const gl = this._gl;

    //gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //gl.clear(gl.COLOR_BUFFER_BIT);
    //gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }

  afterDraw() {
    this.lastCameraX = this.cameraX;
    this.lastCameraY = this.cameraY;
  }

  drawTile(texture, x, y, w, h, ux = 0, uy = 0, uw = 1, uh = 1, z = 1) {
    const gl = this._gl;

    x -= this.cameraX * z;
    y -= this.cameraY * z;

    // Check if the tile is visible.
    if (w === 0 || h === 0 || x > gl.canvas.width || y > gl.canvas.height || x + w < 0 || y + h < 0) {
      return false;
    }

    // Program.
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(this._tileProgram);

    // Texture.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Uniforms.
    gl.uniform2f(this._tileProgram_UCanvas, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(this._tileProgram_UPos, Math.round(x), Math.round(y));
    gl.uniform2f(this._tileProgram_USize, w, h);
    gl.uniform2f(this._tileProgram_UTexPos, ux, uy);
    gl.uniform2f(this._tileProgram_UTexSize, uw, uh);
    gl.uniform1i(this._tileProgram_UTex, 0);

    // Attributes.
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
    gl.enableVertexAttribArray(this._tileProgram_AQuad);
    gl.vertexAttribPointer(this._tileProgram_AQuad, 2, gl.FLOAT, false, 0, 0);

    // Blend func.
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Draw.
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    return true;
  }

  drawPoints(types, xy, vel, first, count) {
    const gl = this._gl;

    // PASS 1 - Fade front texture with offset.

    // Program.
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._fadeFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._fadeTextureBack, 0);
    gl.useProgram(this._fadeProgram);

    // Texture.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._fadeTextureFront);

    // Uniforms.
    gl.uniform2f(this._fadeProgram_USize, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(this._fadeProgram_UOffset, this.cameraX - this.lastCameraX, this.cameraY - this.lastCameraY);
    gl.uniform1i(this._fadeProgram_UTex, 0);

    // Attributes.
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
    gl.enableVertexAttribArray(this._fadeProgram_AQuad);
    gl.vertexAttribPointer(this._fadeProgram_AQuad, 2, gl.FLOAT, false, 0, 0);

    // Blend func.
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Clear.
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw.
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Swap texture.
    const temp = this._fadeTextureFront;
    this._fadeTextureFront = this._fadeTextureBack;
    this._fadeTextureBack = temp;

    // PASS 2 - Render points to texture.

    // Program.
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._fadeFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._fadeTextureFront, 0);
    gl.useProgram(this._pointProgram);

    // Uniforms.
    gl.uniform2f(this._pointProgram_UCanvas, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(this._pointProgram_UCamera, this.cameraX, this.cameraY);

    // Type Attribute.
    const typeBuffer = this._createBuffer(types);
    gl.bindBuffer(gl.ARRAY_BUFFER, typeBuffer);
    gl.enableVertexAttribArray(this._pointProgram_AType);
    gl.vertexAttribPointer(this._pointProgram_AType, 1, gl.BYTE, false, 0, 0);

    // Position Attribute.
    const posBuffer = this._createBuffer(xy);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.enableVertexAttribArray(this._pointProgram_APos);
    gl.vertexAttribPointer(this._pointProgram_APos, 2, gl.FLOAT, false, 0, 0);    

    // Velocity Attribute.
    const velBuffer = this._createBuffer(vel);
    gl.bindBuffer(gl.ARRAY_BUFFER, velBuffer);
    gl.enableVertexAttribArray(this._pointProgram_AVel);
    gl.vertexAttribPointer(this._pointProgram_AVel, 2, gl.FLOAT, false, 0, 0);  

    // Blend func.
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Draw.
    gl.drawArrays(gl.POINTS, first, count);

    // PASS 3 - Render to canvas.

    // Program.
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(this._overlayProgram);

    // Texture.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._fadeTextureFront);

    // Uniforms.
    gl.uniform2f(this._overlayProgram_USize, gl.canvas.width, gl.canvas.height);
    gl.uniform1i(this._overlayProgram_UTex, 0);

    // Attributes.
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
    gl.enableVertexAttribArray(this._overlayProgram_AQuad);
    gl.vertexAttribPointer(this._overlayProgram_AQuad, 2, gl.FLOAT, false, 0, 0);

    // Blend func.
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Draw.
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  }
}

/*
  Tile shaders.
*/
_Graphics.TILE_VERT = `#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 a_quad;
uniform vec2 u_canvas;
uniform vec2 u_pos;
uniform vec2 u_size;
uniform vec2 u_tex_pos;
uniform vec2 u_tex_size;
varying vec2 v_tex_coord;

void main() {

  // Transformations.
  vec2 scale = 2.0 / u_canvas;
  vec2 transform = vec2(-1.0, -1.0);

  // Tile coordinates.
  vec2 tilePos = (a_quad + 1.0) * 0.5;

  // Transform.
  vec2 pos = (u_pos * scale) + transform;
  vec2 size = tilePos * u_size * scale;
  gl_Position = vec4(pos + size, 0, 1.0);

  // Texture coordinates.
  v_tex_coord = (tilePos * u_tex_size * vec2(1.0, -1.0)) + u_tex_pos + vec2(0.0, 1.0);

}`;
_Graphics.TILE_FRAG = `#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_tex_coord;
uniform sampler2D u_tex;

void main() {
  
  gl_FragColor = texture2D(u_tex, v_tex_coord);

}`;

/*
  Point shaders.
*/
_Graphics.POINT_VERT = `#ifdef GL_ES
precision mediump float;
#endif

attribute float a_type;
attribute vec2 a_pos;
attribute vec2 a_vel;
uniform vec2 u_canvas;
uniform vec2 u_camera;
varying vec4 v_color;
varying float v_point_size;

void main() {

  // If the point is dead, move it outside the viewbox.
  if (a_type <= 0.0) {
    gl_PointSize = 0.0;
    gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
    return;
  }

  vec2 pos = (floor((a_pos - u_camera + 0.5) * 2.0) / u_canvas) + vec2(-1.0, -1.0);

  gl_Position = vec4(pos, 0.0, 1.0);
  gl_PointSize = 2.0;

  if (a_type == 1.0) {

    float b = 1.0 - min(max(a_vel.y * -0.01, 0.0), 1.0);

    v_point_size = 2.0 + (b * 2.0);
    v_color = vec4(b * 0.5, 0.3 + (b * 0.7), (b * 0.5) + 0.5, 0.9 + (b * 0.1));

    gl_PointSize = v_point_size;
  }

}`;
_Graphics.POINT_FRAG = `#ifdef GL_ES
precision mediump float;
#endif

varying vec4 v_color;
varying float v_point_size;

void main() {

  gl_FragColor = v_color;

  if (v_point_size > 1.5) {

    vec2 point = gl_PointCoord.xy - 0.5;
    float dist = v_point_size > 1.5 ? (point.x * point.x) + (point.y * point.y) : 0.0;

    if (dist > 0.25) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
  }

}`;

/*
  Fade texture shaders.
*/
_Graphics.FADE_VERT = `#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 a_quad;

void main() {
  gl_Position = vec4(a_quad, 0, 1.0);
}`;

_Graphics.FADE_FRAG =  `#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_tex;
uniform vec2 u_size;
uniform vec2 u_offset;

void main() {

  gl_FragColor = texture2D(u_tex, (gl_FragCoord.xy + u_offset) / u_size);
  gl_FragColor.a -= 0.05;
  gl_FragColor.r += 0.5;
  gl_FragColor.g += 0.25;
  gl_FragColor.b += 0.25;

  if (gl_FragColor.a < 0.5) {
    gl_FragColor.a = 0.0;
  }

}`;

/*
  Overlay shaders.
*/
_Graphics.OVERLAY_VERT = `#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 a_quad;

void main() {
  gl_Position = vec4(a_quad, 0, 1.0);
}`;

_Graphics.OVERLAY_FRAG =  `#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_tex;
uniform vec2 u_size;

void main() {

  gl_FragColor = texture2D(u_tex, gl_FragCoord.xy / u_size);

}`;

/*
  Other helpers.
*/
_Graphics.isPowerOf2 = function (x) {
  return (x & (x - 1)) === 0;
};

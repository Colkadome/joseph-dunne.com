'use strict';
/*
  graphics.js
*/

class _Graphics {

  constructor(canvasEl) {

    this.canvasEl = canvasEl;
    this._gl = null;

    this.cameraX = 0;
    this.cameraY = 0;

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

    // Create tile program.
    this._tileProgram = this._loadProgram(_Graphics.TILE_VERT, _Graphics.TILE_FRAG);
    this._tileProgram_AQuad = gl.getAttribLocation(this._tileProgram, 'a_quad');
    this._tileProgram_UCanvas = gl.getUniformLocation(this._tileProgram, 'u_canvas');
    this._tileProgram_UPos = gl.getUniformLocation(this._tileProgram, 'u_pos');
    this._tileProgram_USize = gl.getUniformLocation(this._tileProgram, 'u_size');
    this._tileProgram_UTexPos = gl.getUniformLocation(this._tileProgram, 'u_tex_pos');
    this._tileProgram_UTexSize = gl.getUniformLocation(this._tileProgram, 'u_tex_size');
    this._tileProgram_UTex = gl.getUniformLocation(this._tileProgram, 'u_tex');

    // Clear canvas.
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);  // Don't need this, we're not in 3D.
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    return this;
  }

  destroy() {
    const gl = this._gl;

    // Destroy buffers.
    gl.deleteBuffer(this._quadBuffer);

    // Destroy programs.
    gl.deleteProgram(this._tileProgram);

    // Destroy textures.
    // TODO

    // Set canvas to 1x1.
    gl.canvas.width = 1;
    gl.canvas.height = 1;

    // Lose the context, if supported.
    const loseContextObj = gl.getExtension('WEBGL_lose_context');
    if (loseContextObj) {
      loseContextObj.loseContext();
    }
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
      const imgData = ctx.getImageData(0, 0, img.width, img.height).data;
      const texture = this._createTexture(img.width, img.height, imgData);
      this.imageMap.set(src, texture);
    };
    img.onerror = () => {
      console.log(`Error loading image: ${src}`);
    };
    img.src = src;

    // Initially set 'src' to null to mark that it is loading.
    this.imageMap.set(src, null);
  }

  drawTileLazy(src, x, y, w, h, ux, uy, uw, uh) {
    const texture = this.imageMap.get(src);
    if (texture !== undefined) {
      if (texture !== null) {
        return this.drawTile(texture, x, y, w, h, ux, uy, uw, uh);
      } else {
        // Draw a generic loading tile here?
      }
    } else {
      this._loadImage(src);
    }
    return false;
  }

  drawTile(texture, x, y, w, h, ux = 0, uy = 0, uw = 1, uh = 1) {
    const gl = this._gl;

    x -= this.cameraX;
    y -= this.cameraY;

    // Check if the tile is visible.
    if (w === 0 || h === 0 || x > gl.canvas.width || y > gl.canvas.height || x + w < 0 || y + h < 0) {
      return false;
    }

    // Texture.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Program.
    gl.useProgram(this._tileProgram);

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

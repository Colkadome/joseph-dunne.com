'use strict';
/*
  Example2Breadth.js
*/

const STEP_FRAG = `#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D state;
uniform vec2 size;

float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
}

float randComponent(float c, float m) {
  return min(max(c + ((rand(gl_FragCoord.xy * m) - 0.5) * 0.01), 0.01), 0.99);
}

vec4 randColor(vec4 col) {
  col.r = randComponent(col.r, 1.0);
  col.g = randComponent(col.g, 2.0);
  col.b = randComponent(col.b, 3.0);
  return col;
}

vec4 getColorAt(int x, int y) {
  return texture2D(state, (gl_FragCoord.xy + vec2(x, y)) / size);
}

int getValue(vec4 color) {
  if (color.r == 1.0 && color.g == 1.0 && color.b == 1.0) {
    return 0;
  } else if (color.r == 0.0 && color.g == 0.0 && color.b == 0.0) {
    return 1;
  } else {
    return 2;
  }
}

int getValueAt(int x, int y) {
  return getValue(getColorAt(x, y));
}

void main() {

  vec4 color = getColorAt(0, 0);
  int value = getValue(color);
  gl_FragColor = color;

  if (value == 0) {

    vec4 up = getColorAt(-1, 0);
    if (getValue(up) == 2) {
      gl_FragColor = randColor(up); return;
    }

    vec4 down = getColorAt(1, 0);
    if (getValue(down) == 2) {
      gl_FragColor = randColor(down); return;
    }

    vec4 left = getColorAt(0, -1);
    if (getValue(left) == 2) {
      gl_FragColor = randColor(left); return;
    }

    vec4 right = getColorAt(0, 1);
    if (getValue(right) == 2) {
      gl_FragColor = randColor(right); return;
    }
    
  }
}`;

const RENDER_FRAG = `#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D state;
uniform vec2 size;

void main() {
  gl_FragColor = texture2D(state, gl_FragCoord.xy / size);
}`;

const QUAD_VERT = `#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 quad;

void main() {
  gl_Position = vec4(quad, 0, 1.0);
}`;

function isPowerOf2 (v) {
  return v > 0 && !(v & (v - 1));
}

class Example2Breadth {

  /**
   * Constructor.
   * @arg {DOM Element} canvasEl - canvas element to use.
   * @arg {Object} opts - additional options.
   */
  constructor(canvasEl) {

    // Check canvas element.
    if (!canvasEl) {
      throw new Error('Missing canvas element argument.');
    }

    // Check width and height.
    // Must be powers of 2 for the texture to render.
    if (!isPowerOf2(canvasEl.width) || !isPowerOf2(canvasEl.height)) {
      throw new Error('Width and Height must be powers of 2');
    }

    // Set options.
    this.canvasEl = canvasEl;
    this.width = canvasEl.width;
    this.height = canvasEl.height;
    this._step = 0;

    this.loaded = false;
  }

  /**
   * Initialisation.
   * @returns {Gol} - self.
   */
  async init() {

    // Check if WebGL is supported.
    const gl = this.canvasEl.getContext('webgl');
    if (gl === null) {
      throw new Error('Unable to initialize WebGL.');
    }
    this._gl = gl;

    // Clear canvas.
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);  // Don't need this, we're not in 3D.

    // Create shader programs.
    this._stepProgram = this._loadProgram(QUAD_VERT, STEP_FRAG);
    this._renderProgram = this._loadProgram(QUAD_VERT, RENDER_FRAG);

    // Create buffers.
    this._quadBuffer = this._createBuffer(new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]));

    // Create textures.
    this._frontTexture = await this._createTextureFromImageUrl(this.width, this.height, './img/2048maze.png');
    this._setPixel(2, 2, [255, 0, 0, 255]);
    this._backTexture = this._createTexture(this.width, this.height, null);

    // Create framebuffers.
    this._stepFramebuffer = gl.createFramebuffer();

    this.draw();

    this.loaded = true;
    this.playing = false;
    return this;
  }

  /**
   * Destroys the GOL and frees all resources.
   * @returns {Gol} - self.
   */
  destroy() {
    const gl = this._gl;

    gl.useProgram(null);

    if (this._stepProgram) {
      gl.deleteProgram(this._stepProgram);
    }

    if (this._renderProgram) {
      gl.deleteProgram(this._renderProgram);
    }

    if (this._defaultFramebuffer) {
      gl.deleteFrameBuffer(this._defaultFramebuffer);
    }

    if (this._stepFramebuffer) {
      gl.deleteFrameBuffer(this._stepFramebuffer);
    }

    this._gl = null;
    return this;
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
   * Loads a WebGL shader program.
   * @arg {String} vertSource - vertex shader string.
   * @arg {String} fragSource - fragment shader string.
   */
  _createBuffer(data) {
    const gl = this._gl;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
  }

  /**
   * Sets a pixel at a particular spot.
   * @arg {Number} x.
   * @arg {Number} y.
   * @arg {Array} pixel - pixel data.
   */
  _setPixel(x, y, pixel) {
    const gl = this._gl;
    gl.bindTexture(gl.TEXTURE_2D, this._frontTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(pixel), 0);
    return this;
  }

  /**
   * Creates a texture using a PNG element.
   * @arg {String} PNG Image url.
   */
  _createTextureFromImageUrl(w, h, url) {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.src = url;
      img.onload = () => {

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        //ctx.beginPath();
        //ctx.fillStyle = '#000';
        //ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0);
        
        resolve(this._createTexture(w, h, ctx.getImageData(0, 0, w, h).data));

      };
      img.onerror = () => {
        reject(new Error('Error loading image'));
      };
    });
  }

  /**
   * Loads a WebGL texture.
   * @arg {Number} w - width of texture.
   * @arg {Number} h - height of texture.
   */
  _createTexture(w, h, data) {
    const gl = this._gl;

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

    return texture;
  }

  /**
   * Draws the current GOL board to the canvas.
   * @returns {Gol} - self.
   */
  _draw(isStep) {
    const gl = this._gl;
    const program = isStep ? this._stepProgram : this._renderProgram;
    const step = this._step % 2;

    if (isStep) {
      // If a step, render out to the back texture and swap textures.
      this._step += 1;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._stepFramebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, step ? this._frontTexture : this._backTexture, 0);

    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, step ? this._backTexture : this._frontTexture);
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(program);

    // Set uniforms.
    const uSizeLocation = gl.getUniformLocation(program, 'size');
    gl.uniform2f(uSizeLocation, this.width, this.height);
    const uStateLocation = gl.getUniformLocation(program, 'state');
    gl.uniform1i(uStateLocation, 0);

    // Bind vertex data.
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
    const aVertexPosition = gl.getAttribLocation(program, 'quad');
    gl.enableVertexAttribArray(aVertexPosition);
    gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);

    // Draw.
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    return this;
  }

  draw() {
    return this._draw(false);
  }

  step() {
    return this._draw(true);
  }

  play() {
    if (!this.loaded || this.playing) {
      return;
    }
    this._interval = setInterval(() => {
      this.step().draw();
    }, 1);
    this.playing = true;
  }

  pause() {
    if (!this.playing) {
      return;
    }
    if (this._interval != null) {
      clearInterval(this._interval);
    }
    this.playing = false;
  }
}

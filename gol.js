/*
  gol.js
*/

class Gol {

  static stepFrag = `#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D state;
uniform vec2 scale;

int get(vec2 offset) {
  return int(texture2D(state, (gl_FragCoord.xy + offset) / scale).r);
}

void main() {
  int sum =
    get(vec2(-1.0, -1.0)) +
    get(vec2(-1.0,  0.0)) +
    get(vec2(-1.0,  1.0)) +
    get(vec2( 0.0, -1.0)) +
    get(vec2( 0.0,  1.0)) +
    get(vec2( 1.0, -1.0)) +
    get(vec2( 1.0,  0.0)) +
    get(vec2( 1.0,  1.0));
  if (sum == 3) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  } else if (sum == 2) {
    float current = float(get(vec2(0.0, 0.0)));
    gl_FragColor = vec4(current, current, current, 1.0);
  } else {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }
}`;

  static renderFrag = `#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D state;
//uniform vec2 scale;

void main() {
  gl_FragColor = texture2D(state, gl_FragCoord.xy / 128.0);
}`;

  static quadVert = `#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 quad;

void main() {
  gl_Position = vec4(quad, 0, 1.0);
}`;

  /**
   * Constructor.
   * @arg {DOM Element} canvasEl - canvas element to use.
   * @arg {Object} opts - additional options.
   */
  constructor(canvasEl, opts) {

    // Check canvas element.
    if (!canvasEl) {
      throw new Error('Missing canvas element argument.');
    }
    this.canvasEl = canvasEl;

    // Set options.
    opts = opts || {};
    this.width = opts.width || canvasEl.width;
    this.height = opts.height || canvasEl.height;
  }

  /**
   * Initialisation.
   * @returns {Gol} - self.
   */
  init() {

    // Check if WebGL is supported.
    const gl = this.canvasEl.getContext('webgl');
    if (gl === null) {
      throw new Error('Unable to initialize WebGL.');
    }
    this._gl = gl;

    // Clear canvas.
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);  // Don't need this, we're not in 3D.

    // Create shader programs.
    this._stepProgram = this._loadProgram(Gol.quadVert, Gol.stepFrag);
    this._renderProgram = this._loadProgram(Gol.quadVert, Gol.renderFrag);

    // Create buffers.
    this._quadBuffer = this._createBuffer(new Float32Array([-0.5, -0.5, 1, -1, -1, 1, 1, 1]));

    // Create textures.
    this._frontTexture = this._createTexture(4, 4, new Uint8Array([
      255, 255, 0,
      255, 255, 0,
      255, 255, 0,
      255, 255, 0,
      255, 0, 0,
      255, 0, 0,
      255, 0, 0,
      255, 0, 0,
      0, 255, 0,
      0, 255, 0,
      0, 255, 0,
      0, 255, 0,
      0, 0, 255,
      0, 0, 255,
      0, 0, 255,
      0, 0, 255,
    ]));

    // Create framebuffers.
    this._stepFramebuffer = gl.createFramebuffer();

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
      throw new Error(gl.getShaderInfoLog(shader));
    }

    // Create fragment shader.
    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragSource);
    gl.compileShader(fragShader);
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
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
   * Loads a WebGL texture.
   * @arg {String} vertSource - vertex shader string.
   * @arg {String} fragSource - fragment shader string.
   */
  _createTexture(w, h, data) {
    const gl = this._gl;

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, w, h, 0, gl.RGB, gl.UNSIGNED_BYTE, data);
    return texture;
  }

  /**
   * Draws the current GOL board to the canvas.
   * @returns {Gol} - self.
   */
  draw() {
    const gl = this._gl;
    const program = this._renderProgram;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, this._frontTexture);
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(program);

    // Bind vertex data.
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
    const aVertexPosition = gl.getAttribLocation(program, 'quad');
    gl.enableVertexAttribArray(aVertexPosition);
    gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);

    // Draw.
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  }

}

'use strict';
/*
  gol.js
*/

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var STEP_FRAG = "#ifdef GL_ES\nprecision mediump float;\n#endif\n\nuniform sampler2D state;\nuniform vec2 size;\n\nint get(int x, int y) {\n  return int(texture2D(state, (gl_FragCoord.xy + vec2(x, y)) / size).a);\n}\n\nvoid main() {\n  gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);\n  int sum =\n    get(-1, -1) +\n    get(-1, 0) +\n    get(-1, 1) +\n    get(0, -1) +\n    get(0, 1) +\n    get(1, -1) +\n    get(1, 0) +\n    get(1, 1);\n  if (sum == 3) {\n    gl_FragColor.a = 1.0;\n  } else if (sum == 2) {\n    float current = float(get(0, 0));\n    gl_FragColor.a = current;\n  } else {\n    gl_FragColor.a = 0.0;\n  }\n}";
var RENDER_FRAG = "#ifdef GL_ES\nprecision mediump float;\n#endif\n\nuniform sampler2D state;\nuniform vec2 size;\n\nvoid main() {\n  gl_FragColor = texture2D(state, gl_FragCoord.xy / size);\n}";
var QUAD_VERT = "#ifdef GL_ES\nprecision mediump float;\n#endif\n\nattribute vec2 quad;\n\nvoid main() {\n  gl_Position = vec4(quad, 0, 1.0);\n}";

function isPowerOf2(v) {
  return v > 0 && !(v & v - 1);
}

var Gol =
/*#__PURE__*/
function () {
  /**
   * Constructor.
   * @arg {DOM Element} canvasEl - canvas element to use.
   * @arg {Object} opts - additional options.
   */
  function Gol(canvasEl, opts) {
    _classCallCheck(this, Gol);

    // Check canvas element.
    if (!canvasEl) {
      throw new Error('Missing canvas element argument.');
    } // Check width and height.
    // Must be powers of 2 for the texture to render.


    opts = opts || {};
    var width = opts.width || canvasEl.width;
    var height = opts.height || canvasEl.height;

    if (!isPowerOf2(width) || !isPowerOf2(height)) {
      throw new Error('Width and Height must be powers of 2');
    } // Set options.


    this.canvasEl = canvasEl;
    this.width = width;
    this.height = height;
  }
  /**
   * Initialisation.
   * @returns {Gol} - self.
   */


  _createClass(Gol, [{
    key: "init",
    value: function init() {
      // Check if WebGL is supported.
      var gl = this.canvasEl.getContext('webgl');

      if (gl === null) {
        throw new Error('Unable to initialize WebGL.');
      }

      this._gl = gl; // Clear canvas.

      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.DEPTH_TEST); // Don't need this, we're not in 3D.
      // Create shader programs.

      this._stepProgram = this._loadProgram(QUAD_VERT, STEP_FRAG);
      this._renderProgram = this._loadProgram(QUAD_VERT, RENDER_FRAG); // Create buffers.

      this._quadBuffer = this._createBuffer(new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])); // Create textures.

      this._frontTexture = this._createRandomTexture(this.width, this.height);
      this._backTexture = this._createTexture(this.width, this.height, null); // Create framebuffers.

      this._stepFramebuffer = gl.createFramebuffer();
      this._step = 0;
      return this;
    }
    /**
     * Destroys the GOL and frees all resources.
     * @returns {Gol} - self.
     */

  }, {
    key: "destroy",
    value: function destroy() {
      var gl = this._gl;
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

  }, {
    key: "_loadProgram",
    value: function _loadProgram(vertSource, fragSource) {
      var gl = this._gl; // Create vertex shader.

      var vertShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertShader, vertSource);
      gl.compileShader(vertShader);

      if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(vertShader));
      } // Create fragment shader.


      var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragShader, fragSource);
      gl.compileShader(fragShader);

      if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(fragShader));
      } // Create program.


      var program = gl.createProgram();
      gl.attachShader(program, vertShader);
      gl.attachShader(program, fragShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
      } // Cleanup.


      gl.detachShader(program, vertShader);
      gl.detachShader(program, fragShader);
      gl.deleteShader(vertShader);
      gl.deleteShader(fragShader); // Return program ID.

      return program;
    }
    /**
     * Loads a WebGL shader program.
     * @arg {String} vertSource - vertex shader string.
     * @arg {String} fragSource - fragment shader string.
     */

  }, {
    key: "_createBuffer",
    value: function _createBuffer(data) {
      var gl = this._gl;
      var buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      return buffer;
    }
    /**
     * Loads a random WebGL texture.
     * @arg {Number} w - width of texture.
     * @arg {Number} h - height of texture.
     */

  }, {
    key: "_createRandomTexture",
    value: function _createRandomTexture(w, h) {
      var p = 0.5;
      var size = w * h * 4;
      var data = new Uint8Array(size);

      for (var i = 0; i < size; i += 4) {
        var b = Math.random() < p ? 255 : 0;
        data[i] = 128;
        data[i + 1] = 128;
        data[i + 2] = 128;
        data[i + 3] = b;
      }

      return this._createTexture(w, h, data);
    }
    /**
     * Loads a WebGL texture.
     * @arg {Number} w - width of texture.
     * @arg {Number} h - height of texture.
     */

  }, {
    key: "_createTexture",
    value: function _createTexture(w, h, data) {
      var gl = this._gl;
      var texture = gl.createTexture();
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

  }, {
    key: "_draw",
    value: function _draw(isStep) {
      var gl = this._gl;
      var program = isStep ? this._stepProgram : this._renderProgram;
      var step = this._step % 2;

      if (isStep) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._stepFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, step ? this._frontTexture : this._backTexture, 0);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, step ? this._backTexture : this._frontTexture);
      gl.viewport(0, 0, this.width, this.height);
      gl.useProgram(program); // Set uniforms.

      var uSizeLocation = gl.getUniformLocation(program, 'size');
      gl.uniform2f(uSizeLocation, this.width, this.height);
      var uStateLocation = gl.getUniformLocation(program, 'state');
      gl.uniform1i(uStateLocation, 0); // Bind vertex data.

      gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
      var aVertexPosition = gl.getAttribLocation(program, 'quad');
      gl.enableVertexAttribArray(aVertexPosition);
      gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0); // Draw.

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (isStep) {
        this._step += 1;
      }

      return this;
    }
  }, {
    key: "draw",
    value: function draw() {
      return this._draw(false);
    }
  }, {
    key: "step",
    value: function step() {
      return this._draw(true);
    }
  }]);

  return Gol;
}();
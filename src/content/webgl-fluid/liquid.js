'use strict';
/*
  liquid.js
*/

class Liquid {

  constructor(canvasEl, opts) {
    if (!canvasEl) {
      throw new Error('Canvas is required');
    }
    this.canvasEl = canvasEl;

    // Merge options with default values.
    opts = {
      count: 100,
      interactionRadius: 50,
      stiffness: 10000,
      stiffnessNear: 10000,
      restDensity: 2,
      gravity: 1000,
      randomMotion: 20,
      ...opts,
    };

    this.count = opts.count;
    this.interactionRadius = opts.interactionRadius;
    this.stiffness = opts.stiffness;
    this.stiffnessNear = opts.stiffnessNear;
    this.restDensity = opts.restDensity;
    this.gravity = opts.gravity;
    this.randomMotion = opts.randomMotion;
  }

  init() {

    const count = this.count;
    const width = this.canvasEl.width;
    const height = this.canvasEl.height;

    // Init WebGL.
    // NOTE: Alpha not supported by Safari?
    const gl = this.canvasEl.getContext('webgl', { depth: false, alpha: false });
    if (gl === null) {
      throw new Error('Unable to initialize WebGL.');
    }
    this._gl = gl;

    // Particle properties.
    this.xy = new Float32Array(count * 2);
    this.vxy = new Float32Array(count * 2);
    this.xyOld = new Float32Array(count * 2);

    // Other properties to speed up access.
    this.g = new Float32Array(count);
    this.neighbours = new Uint32Array(count);
    this.len = new Float32Array(count);

    // Clear canvas.
    gl.disable(gl.DEPTH_TEST);  // Don't need this, we're not in 3D.

    // Create pass 1 program.
    this._pass1Program = this._loadProgram(Liquid.PASS1_VERT, Liquid.PASS1_FRAG);
    this._pass1UPointsize = gl.getUniformLocation(this._pass1Program, 'u_pointsize');
    this._pass1USize = gl.getUniformLocation(this._pass1Program, 'u_size');
    this._pass1APos = gl.getAttribLocation(this._pass1Program, 'a_pos');

    // Create pass 2 program.
    this._pass2Program = this._loadProgram(Liquid.PASS2_VERT, Liquid.PASS2_FRAG);
    this._pass2USize = gl.getUniformLocation(this._pass2Program, 'u_size');
    this._pass2UState = gl.getUniformLocation(this._pass2Program, 'u_state');
    this._pass2AQuad = gl.getAttribLocation(this._pass2Program, 'a_quad');

    // Create buffers.
    this._quadBuffer = this._createBuffer(new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]));

    // Create textures.
    this._midTexture = this._createTexture(width, height, null);

    // Create framebuffers.
    this._midFramebuffer = gl.createFramebuffer();

    // Init particles.
    this.resetParticles();

    return this;
  }

  /**
   * Frees all resources.
   * @returns {Gol} - self.
   */
  destroy() {

    // Free all WebGL resources.
    const gl = this._gl;
    gl.useProgram(null);
    if (this._pass1Program) {
      gl.deleteProgram(this._pass1Program);
    }
    if (this._pass2Program) {
      gl.deleteProgram(this._pass2Program);
    }
    if (this._midFramebuffer) {
      gl.deleteFramebuffer(this._midFramebuffer);
    }
    if (this._quadBuffer) {
      gl.deleteBuffer(this._quadBuffer);
    }
    if (this._midTexture) {
      gl.deleteTexture(this._midTexture);
    }
    this._gl = null;

    // Free particle stuff.
    this.xy = null;
    this.vxy = null;
    this.xyOld = null;
    this.g = null;
    this.neighbours = null;
    this.len = null;

    return this;
  }

  /**
   * Resets all particle positions.
   */
  resetParticles() {

    const count = this.count;
    const width = this.canvasEl.width;
    const height = this.canvasEl.height;

    for (let i = 0; i < count; i += 1) {

      // Set random positions of particle inside container.
      this.xy[i * 2] = Math.random() * width;
      this.xy[(i * 2) + 1] = Math.random() * height;

      // Set 0 velocity.
      this.vxy[i * 2] = 0;
      this.vxy[(i * 2) + 1] = 0;
    }

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
   * Loads a WebGL texture.
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
   * Draws the scene.
   */
  draw() {
    const gl = this._gl;
    const count = this.count;
    const width = this.canvasEl.width;
    const height = this.canvasEl.height;

    /*
      PASS 1.
    */

    gl.bindFramebuffer(gl.FRAMEBUFFER, this._midFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._midTexture, 0);
    gl.viewport(0, 0, width, height);
    gl.useProgram(this._pass1Program);

    // Set uniforms.
    const RADIUS = 50;
    gl.uniform1f(this._pass1UPointsize, RADIUS);
    gl.uniform2f(this._pass1USize, width, height);

    // Create buffer.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.xy, gl.STATIC_DRAW);

    // Bind vertex data.
    gl.enableVertexAttribArray(this._pass1APos);
    gl.vertexAttribPointer(this._pass1APos, 2, gl.FLOAT, false, 0, 0);

    // Clear.
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Blend func.
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // Draw points.
    gl.drawArrays(gl.POINTS, 0, count);

    /*
      PASS 2.
    */
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(this._pass2Program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._midTexture);
    gl.viewport(0, 0, width, height);

    // Set uniforms.
    gl.uniform2f(this._pass2USize, width, height);
    gl.uniform1i(this._pass2UState, 0);

    // Bind vertex data.
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
    gl.enableVertexAttribArray(this._pass2AQuad);
    gl.vertexAttribPointer(this._pass2AQuad, 2, gl.FLOAT, false, 0, 0);

    // Don't need blend anymore.
    gl.disable(gl.BLEND);

    // Draw quad.
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    return this;
  }

  /**
   * Updates the scene.
   */
  update(dT) {

    // Check if updating.
    if (!dT) {
      return this;
    }

    // Make sure dT isn't too large, or the physics breaks down.
    if (dT > 0.02) {
      dT = 0.02;
    }

    // Get properties.
    const INTERACTION_RADIUS = this.interactionRadius;
    const INTERACTION_RADIUS_SQ = INTERACTION_RADIUS * INTERACTION_RADIUS;
    const STIFFNESS = this.stiffness;  // Attraction.
    const STIFFNESS_NEAR = this.stiffnessNear;  // Spread.
    const REST_DENSITY = this.restDensity;  // Attraction when idle.
    const GRAVITY = this.gravity;
    const RANDOM_MOTION = this.randomMotion;

    const count = this.count;
    const width = this.canvasEl.width;
    const height = this.canvasEl.height;
    const dTSqu = dT * dT;
    const dTInv = 1 / dT;

    // Pass 1.
    for (let i = 0; i < count * 2; i += 1) {

      // Apply random motion.
      if (RANDOM_MOTION) {
        this.vxy[i] += (Math.random() - 0.5) * RANDOM_MOTION * dT * 2;
      }

      // Apply acceleration.
      if (GRAVITY && i % 2 > 0) {
        this.vxy[i] += GRAVITY * dT;
      }

      // Update positions.
      this.xyOld[i] = this.xy[i];
      this.xy[i] += this.vxy[i] * dT;
    }

    // Pass 2.
    for (let i = 0; i < count; i += 1) {
      const ix = (i * 2);
      const iy = ix + 1;

      // Find close neighbours.
      let density = 0;
      let nearDensity = 0;
      let neighbourCount = 0;
      for (let k = 0; k < count; k += 1) {
        if (k === i)  {
          continue;
        }
        const kx = (k * 2);
        const ky = kx + 1;

        // Get difference.
        const xd = Math.abs(this.xy[ix] - this.xy[kx]);
        const yd = Math.abs(this.xy[iy] - this.xy[ky]);
        if (xd > INTERACTION_RADIUS || yd > INTERACTION_RADIUS) {
          continue;
        }

        // Get square difference.
        const sq = (xd * xd) + (yd * yd);
        if (sq > INTERACTION_RADIUS_SQ) {
          continue;
        }

        // Get ratio.
        // TODO: https://www.h3xed.com/programming/fast-unit-vector-calculation-for-2d-games

        // Get gradient.
        // NOTE: Sometimes gived NaN, why?
        const len = Math.sqrt(sq);
        const g = 1 - (len / INTERACTION_RADIUS);
        if (g === 0 || Number.isNaN(g)) {
          continue;
        }

        // The particle is a neighbour at this point. Add up densities.
        density += g * g;
        nearDensity += g * g * g;
        this.g[k] = g;
        this.len[k] = len;

        // Store index to neighbour.
        this.neighbours[neighbourCount] = k;
        neighbourCount += 1;
      }

      // Get density.
      const p = STIFFNESS * (density - REST_DENSITY);
      const pNear = STIFFNESS_NEAR * nearDensity;

      // Apply relaxation.
      for (let n = 0; n < neighbourCount; n += 1) {
        const k = this.neighbours[n];
        const g = this.g[k];
        const len = this.len[k];
        const kx = k * 2;
        const ky = kx + 1;

        const m = ((p + (pNear * g)) * g * dTSqu) / len;

        const dx = (this.xy[kx] - this.xy[ix]) * m;
        const dy = (this.xy[ky] - this.xy[iy]) * m;

        this.xy[ix] += dx * -0.5;
        this.xy[iy] += dy * -0.5;

        this.xy[kx] += dx * 0.5;
        this.xy[ky] += dy * 0.5;
      }
    }

    // Pass 3.
    for (let i = 0; i < count; i += 1) {
      const ix = i * 2;
      const iy = ix + 1;

      // Constrain the particles to a container.
      const x = this.xy[ix];
      const y = this.xy[iy];
      if (x < 0) {
        this.xy[ix] = 0;
      } else if (x > width) {
        this.xy[ix] = width;
      }
      if (y < 0) {
        this.xy[iy] = 0; 
      } else if (y > height) {
        this.xy[iy] = height;
      }

      // Calculate new velocity.
      this.vxy[ix] = (this.xy[ix] - this.xyOld[ix]) * dTInv;
      this.vxy[iy] = (this.xy[iy] - this.xyOld[iy]) * dTInv;
    }

    return this;
  }
}

/*
  Pass 1 GLSL.
*/

Liquid.PASS1_VERT = `#ifdef GL_ES
precision mediump float;
#endif

uniform float u_pointsize;
uniform vec2 u_size;
attribute vec2 a_pos;

void main() {

  gl_PointSize = u_pointsize;

  // Reposition to default coordinates (-0.5, 0.5).
  gl_Position = vec4(((a_pos / u_size) - 0.5) * vec2(2, -2), 0.0, 1.0);
}`;

Liquid.PASS1_FRAG = `#ifdef GL_ES
precision mediump float;
#endif

void main() {

  vec2 point = gl_PointCoord.xy - 0.5;

  // Check square distance.
  float dist = (point.x * point.x) + (point.y * point.y);
  if (dist > 0.25) {

    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);

  } else {

    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0 - (sqrt(dist) * 2.0));

  }
}`;

/*
  Pass 2 GLSL.
*/

Liquid.PASS2_VERT = `#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 a_quad;

void main() {
  gl_Position = vec4(a_quad, 0, 1.0);
}`;

Liquid.PASS2_FRAG =  `#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_state;
uniform vec2 u_size;

void main() {

  vec4 color = texture2D(u_state, gl_FragCoord.xy / u_size);
  if (color.a < 0.5) {

    // Discard.
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);

  } else if (color.a < 0.6) {

    // Outer border.
    gl_FragColor = vec4(0.0, 0.4, 1.0, 1.0);

  } else if (color.a < 0.7) {

    // Inner border.
    gl_FragColor = vec4(0.0, 0.3, 0.9, 1.0);

  } else {

    // Inner blue.
    gl_FragColor = vec4(0.0, 0.2, 0.8, 1.0);

  }
}`;

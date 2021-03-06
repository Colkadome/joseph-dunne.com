'use strict';
/*
  liquid.js
*/

class Liquid {

  constructor(canvasEl, opts) {
    opts = {
      count: 100,
      ...opts,
    };

    this.canvasEl = canvasEl;
    this.width = this.canvasEl.width;
    this.height = this.canvasEl.height;
    this.count = opts.count;

    // Particle properties.
    this.xy = new Float32Array(opts.count * 2);
    this.vxy = new Float32Array(opts.count * 2);
    this.xyOld = new Float32Array(opts.count * 2);

    // Other properties to speed up access.
    this.g = new Float32Array(opts.count);
    this.neighbours = new Uint32Array(opts.count);
  }

  init() {

    // Init WebGL.
    const gl = this.canvasEl.getContext('webgl', { depth: false, alpha: true });
    if (gl === null) {
      throw new Error('Unable to initialize WebGL.');
    }
    this._gl = gl;

    // Clear canvas.
    gl.disable(gl.DEPTH_TEST);  // Don't need this, we're not in 3D.
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Create shader programs.
    this._pass1Program = this._loadProgram(Liquid.PASS1_VERT, Liquid.PASS1_FRAG);
    this._pass2Program = this._loadProgram(Liquid.PASS2_VERT, Liquid.PASS2_FRAG);

    // Create buffers.
    this._quadBuffer = this._createBuffer(new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]));

    // Create textures.
    this._midTexture = this._createTexture(this.width, this.height, null);

    // Create framebuffers.
    this._midFramebuffer = gl.createFramebuffer();

    // Init particles.
    this.resetParticles();

    // Load will.
    const img = new Image();
    img.src = './will.png';
    img.onload = () => {
      const canv = document.createElement('canvas');
      canv.width = img.width;
      canv.height = img.height;
      const ctx = canv.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canv.width, canv.height);
      this._willTexture = this._createTexture(data.width, data.height, data.data);
    };

    // Load will.
    const img2 = new Image();
    img2.src = './will2.png';
    img2.onload = () => {
      const canv = document.createElement('canvas');
      canv.width = img2.width;
      canv.height = img.height;
      const ctx = canv.getContext('2d');
      ctx.drawImage(img2, 0, 0);
      const data = ctx.getImageData(0, 0, canv.width, canv.height);
      this._willTexture2 = this._createTexture(data.width, data.height, data.data);
    };

    return this;
  }

  /**
   * Resets all particle positions.
   */
  resetParticles() {

    for (let i = 0; i < this.count; i += 1) {

      // Set random positions of particle inside container.
      this.xy[i * 2] = ((Math.random() * 0.5) + 0.25) * this.canvasEl.width;
      this.xy[(i * 2) + 1] = (Math.random() * 0.5) * this.canvasEl.height;

      // Set 0 velocity.
      this.vxy[i * 2] = 0;
      this.vxy[(i * 2) + 1] = 0;
    }

    return this;
  }

  /**
   *  Add force at.
   */
  addForceAt(xx, yy, force) {

    const INTERACTION_RADIUS = 100;
    const INTERACTION_RADIUS_SQ = INTERACTION_RADIUS * INTERACTION_RADIUS;

    for (let i = 0; i < this.count; i += 1) {
      const ix = (i * 2);
      const iy = ix + 1;

      // Get position.
      const x = this.xy[ix];
      const y = this.xy[iy];

      // Get distance to point.
      const xd = x - xx;
      const yd = y - yy;
      const sq = (xd * xd) + (yd * yd);
      if (sq > INTERACTION_RADIUS_SQ) {
        continue;
      }

      // Get gradient.
      const len = Math.sqrt(sq);
      const g = 1 - (len / INTERACTION_RADIUS);
      if (g === 0) {
        continue;
      }

      // Get unit vector.
      const dx = xd / len;
      const dy = yd / len;

      // Add force.
      this.vxy[ix] += dx * len * force;
      this.vxy[iy] += dy * len * force;
    }

  }

  /**
   * Unloads WebGL and frees up assets.
   */
  destroy() {


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
    
    const RADIUS = 50;

    // PASS 1.

    gl.bindFramebuffer(gl.FRAMEBUFFER, this._midFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._midTexture, 0);
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this._pass1Program);

    // Set uniforms.
    const uPointSizeLocation = gl.getUniformLocation(this._pass1Program, 'u_pointsize');
    gl.uniform1f(uPointSizeLocation, RADIUS);
    const uSizeLocation = gl.getUniformLocation(this._pass1Program, 'u_size');
    gl.uniform2f(uSizeLocation, this.width, this.height);

    // Create buffer.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.xy, gl.STATIC_DRAW);

    // Bind vertex data.
    const aVertexPosition = gl.getAttribLocation(this._pass1Program, 'a_pos');
    gl.enableVertexAttribArray(aVertexPosition);
    gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);

    // Create buffer.
    const bufferVelocity = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferVelocity);
    gl.bufferData(gl.ARRAY_BUFFER, this.vxy, gl.STATIC_DRAW);

    // Bind velocity data.
    const aVelocityPosition = gl.getAttribLocation(this._pass1Program, 'a_vel');
    gl.enableVertexAttribArray(aVelocityPosition);
    gl.vertexAttribPointer(aVelocityPosition, 2, gl.FLOAT, false, 0, 0);

    // Will texture.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._willTexture);
    const uWillLocation = gl.getUniformLocation(this._pass1Program, 'state');
    gl.uniform1i(uWillLocation, 0);

    // Clear.
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Blend func.
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Draw points.
    gl.drawArrays(gl.POINTS, 0, this.count);


    // PASS 2.
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(this._pass2Program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._midTexture);
    gl.viewport(0, 0, this.width, this.height);

    // Set uniforms.
    const uSizeLocation2 = gl.getUniformLocation(this._pass2Program, 'size');
    gl.uniform2f(uSizeLocation2, this.width, this.height);
    const uStateLocation = gl.getUniformLocation(this._pass2Program, 'state');
    gl.uniform1i(uStateLocation, 0);

    // Bind vertex data.
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
    const aVertexPosition2 = gl.getAttribLocation(this._pass2Program, 'quad');
    gl.enableVertexAttribArray(aVertexPosition2);
    gl.vertexAttribPointer(aVertexPosition2, 2, gl.FLOAT, false, 0, 0);

    // Blend func.
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Draw quad.
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  }

  /**
   * Updates the scene.
   */
  update(dT) {

    // Check if updating.
    if (!dT) {
      return;
    }

    // Make sure dT isn't too large, or the physics breaks down.
    if (dT > 0.02) {
      dT = 0.02;
    }

    const INTERACTION_RADIUS = 50.0;
    const INTERACTION_RADIUS_SQ = INTERACTION_RADIUS * INTERACTION_RADIUS;
    const STIFFNESS = 10000.0;  // Attraction.
    const STIFFNESS_NEAR = 10000.0;  // Spread.
    const REST_DENSITY = 2.0;  // Attraction when idle.
    const GRAVITY = 1000;
    const RANDOM_MOTION = 20.0;

    const count = this.count;
    const width = this.canvasEl.width;
    const height = this.canvasEl.height;
    const dTSqu = dT * dT;
    const dTInv = 1 / dT;

    // Pass 1.
    for (let i = 0; i < count * 2; i += 1) {

      // Update old positions.
      this.xyOld[i] = this.xy[i];

      // Apply random motion.
      if (RANDOM_MOTION) {
        this.vxy[i] += (Math.random() - 0.5) * RANDOM_MOTION * dT * 2;
      }

      // Apply gravity to Y axis.
      if (GRAVITY && i % 2 > 0) {
        this.vxy[i] += GRAVITY * dT;
      }

      // Update positions.
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

        // Get gradient.
        const g = 1 - (Math.sqrt(sq) / INTERACTION_RADIUS);
        if (g === 0) {
          continue;
        }

        // The particle is a neighbour at this point. Add up densities.
        density += g * g;
        nearDensity += g * g * g;
        this.g[k] = g;

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
        const kx = k * 2;
        const ky = kx + 1;

        const m = ((p * g) + (pNear * g * g)) * dTSqu;

        const xd = this.xy[kx] - this.xy[ix];
        const yd = this.xy[ky] - this.xy[iy];
        const len = Math.sqrt((xd * xd) + (yd * yd));

        const dx = (xd / len) * m;
        const dy = (yd / len) * m;

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

      // Triangles.
      const halfH = height;
      if (y < 256) {
        if (x + (height - y) < 730) {
          this.xy[ix] += 1;
          this.xy[iy] -= 1;
        }
        if ((width - x) + (height - y) < 730) {
          this.xy[ix] -= 1;
          this.xy[iy] -= 1;
        }
      }

      // Calculate new velocity.
      this.vxy[ix] = (this.xy[ix] - this.xyOld[ix]) * dTInv;
      this.vxy[iy] = (this.xy[iy] - this.xyOld[iy]) * dTInv;
    }

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
attribute vec2 a_vel;

varying float speed;

void main() {

  gl_PointSize = u_pointsize;
  gl_Position = vec4(((a_pos / u_size) - 0.5) * vec2(2, -2), 0.0, 1.0);

  speed = length(a_vel);
}`;

Liquid.PASS1_FRAG = `#ifdef GL_ES
precision mediump float;
#endif

varying float speed;
uniform sampler2D state;
uniform vec2 u_size;

void main() {

  vec2 point = gl_PointCoord.xy - 0.5;
  float dist = length(point);

  // Fast square.
  if (dist > 0.5) {
    discard;
  }

  vec3 color = texture2D(state, gl_PointCoord.xy).rgb;

  gl_FragColor = vec4(color, 1.0 - (dist * 2.0));
}`;

/*
  Pass 2 GLSL.
*/

Liquid.PASS2_VERT = `#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 quad;

void main() {
  gl_Position = vec4(quad, 0, 1.0);
}`;

Liquid.PASS2_FRAG =  `#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D state;
uniform vec2 size;

void main() {

  vec4 color = texture2D(state, gl_FragCoord.xy / size);
  if (color.a < 0.1) {
    discard;
  }

  if (color.a > 0.2) {
    color.a = 1.0;
  } else {
    color = vec4(1.0, 0.0, 0.0, 0.6);
  }

  gl_FragColor = color;
  
}`;

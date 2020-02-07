/*
  liquid.js
*/

function getApproximateUnitVector(x, y) {
  const len = Math.sqrt((x * x) + (y * y));
  return [x / len, y / len];
}

class Liquid {

  /*
    Pass 1 - render circles.
  */

  static PASS1_VERT = `#ifdef GL_ES
precision mediump float;
#endif

uniform float u_pointsize;
uniform vec2 u_size;
attribute vec2 a_pos;
attribute vec2 a_vel;

varying vec2 vel;

void main() {

  gl_PointSize = u_pointsize;
  gl_Position = vec4(((a_pos / u_size) - 0.5) * vec2(2, -2), 0.0, 1.0);

  vel = gl_Position.xy;
}`;

  static PASS1_FRAG =  `#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vel;

void main() {

  vec2 point = gl_PointCoord.xy - 0.5;
  float distSq = (point.x * point.x) + (point.y * point.y);

  // Fast square.
  if (distSq > 0.25) {
    discard;
  }

  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0 - (distSq * 4.0));
}`;

  /*
    Pass 2 - clamp.
  */

  static PASS2_VERT = `#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 quad;

void main() {
  gl_Position = vec4(quad, 0, 1.0);
}`;

  static PASS2_FRAG =  `#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D state;
uniform vec2 size;

void main() {

  vec4 color = texture2D(state, gl_FragCoord.xy / size);

  if (color.a < 0.9) {
    discard;
  }

  if (color.a > 0.95) {
    gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
  } else {
    gl_FragColor = vec4(0.0, 0.4, 1.0, 1.0);
  }
  
}`;

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
    this.oldX = new Float32Array(opts.count);
    this.oldY = new Float32Array(opts.count);
    this.vx = new Float32Array(opts.count);
    this.vy = new Float32Array(opts.count);
    this.p = new Float32Array(opts.count);
    this.pNear = new Float32Array(opts.count);
    this.g = new Float32Array(opts.count);
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
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

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
    for (let i = 0; i < this.count; i += 1) {

      // Set random positions of particle inside container.
      this.xy[i * 2] = Math.random() * this.canvasEl.width;
      this.xy[(i * 2) + 1] = Math.random() * this.canvasEl.height;

      // Zero out all the rest of the values.
      this.oldX[i] = 0;
      this.oldY[i] = 0;
      this.vx[i] = 0;
      this.vy[i] = 0;
      this.p[i] = 0;
      this.pNear[i] = 0;
      this.g[i] = 0;
    }

    return this;
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
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
    //gl.activeTexture(gl.TEXTURE0);
    //gl.bindTexture(gl.TEXTURE_2D, null);

    // Clear background.
    // TODO: Do this.

    //gl.bindFramebuffer(gl.FRAMEBUFFER, null);

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

    // Bind velocity data.
    const aVelocityPosition = gl.getAttribLocation(this._pass1Program, 'a_vel');
    gl.enableVertexAttribArray(aVelocityPosition);
    gl.vertexAttribPointer(aVelocityPosition, 2, gl.FLOAT, false, 0, 0);

    // Clear.
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

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
    const INTERACTION_RADIUS_SQ = Math.pow(INTERACTION_RADIUS, 2);
    const STIFFNESS = 10000.0;  // Attraction.
    const STIFFNESS_NEAR = 10000.0;  // Spread.
    const REST_DENSITY = 3.0;  // Attraction when idle.
    const GRAVITY = 1000;
    const RANDOM_MOTION = 20.0;

    // Pass 1.
    for (let i = 0; i < this.count; i += 1) {

      const ix = i * 2;
      const iy = ix + 1;

      // Update old positions.
      this.oldX[i] = this.xy[ix];
      this.oldY[i] = this.xy[iy];

      // Apply random motion.
      this.vx[i] += (Math.random() - 0.5) * RANDOM_MOTION * dT * 2;
      this.vy[i] += (Math.random() - 0.5) * RANDOM_MOTION * dT * 2;

      // Apply gravity.
      this.vy[i] += GRAVITY * dT;

      // Update positions.
      this.xy[ix] += this.vx[i] * dT;
      this.xy[iy] += this.vy[i] * dT;

      // Update hashmap for quick lookup.
      // TODO.

    }

    // Pass 2.
    for (let i = 0; i < this.count; i += 1) {

      const ix = i * 2;
      const iy = ix + 1;

      // Find close neighbours.
      // TODO: use hashmap here to help lookup.
      const neighbours = [];
      for (let k = 0; k < this.count; k += 1) {
        if (k === i)  {
          continue;
        }

        const kx = k * 2;
        const ky = kx + 1;

        const lsq = Math.pow(this.xy[ix] - this.xy[kx], 2) + Math.pow(this.xy[iy] - this.xy[ky], 2);
        if (lsq > INTERACTION_RADIUS_SQ) {
          continue;
        }

        this.g[k] = 1 - (Math.sqrt(lsq) / INTERACTION_RADIUS);
        neighbours.push(k);
      }

      // Update density.
      let density = 0;
      let nearDensity = 0;
      for (let k of neighbours) {
        const g = this.g[k];
        density += g * g;
        nearDensity += g * g * g;
      }
      this.p[i] = STIFFNESS * (density - REST_DENSITY);
      this.pNear[i] = STIFFNESS_NEAR * nearDensity;

      // Apply relaxation.
      for (let k of neighbours) {
        const g = this.g[k];

        const kx = k * 2;
        const ky = kx + 1;

        const magnitude = (this.p[i] * g) + (this.pNear[i] * g * g);
        const direction = getApproximateUnitVector(this.xy[kx] - this.xy[ix], this.xy[ky] - this.xy[iy]);
        const d = [direction[0] * magnitude * dT * dT, direction[1] * magnitude * dT * dT];

        this.xy[ix] += d[0] * -0.5;
        this.xy[iy] += d[1] * -0.5;

        this.xy[kx] += d[0] * 0.5;
        this.xy[ky] += d[1] * 0.5;
      }
    }

    // Pass 3.
    for (let i = 0; i < this.count; i += 1) {

      const ix = i * 2;
      const iy = ix + 1;

      // Constrain the particles to a container.
      const x = this.xy[ix];
      const y = this.xy[iy];
      if (x < 0) {
        this.xy[ix] = 0;
      } else if (x > this.canvasEl.width) {
        this.xy[ix] = this.canvasEl.width;
      }
      if (y < 0) {
        this.xy[iy] = 0; 
      } else if (y > this.canvasEl.height) {
        this.xy[iy] = this.canvasEl.height;
      }

      // Calculate new velocity.
      this.vx[i] = (this.xy[ix] - this.oldX[i]) * (1 / dT);
      this.vy[i] = (this.xy[iy] - this.oldY[i]) * (1 / dT);
    }

  }

}

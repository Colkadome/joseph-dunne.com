'use strict';
/*
  Particles.js
*/

class _Particles {

  constructor() {

    this.types = new Set(['draw', 'update', 'particle']);

    this.WIDTH = 32;
    this.HEIGHT = 32;
  }

  init() {
    const gl = this.graphics._gl;

    // Create programs.
    this._stepProgram = this.graphics._loadProgram(_Particles.stepVertex, _Particles.stepFragment);
    this._stepProgram_u_dt = gl.getUniformLocation(this._stepProgram, 'u_dt');
    this._stepProgram_u_tex = gl.getUniformLocation(this._stepProgram, 'u_tex');
    this._stepProgram_a_quad = gl.getUniformLocation(this._stepProgram, 'a_quad');

    this._drawProgram = this.graphics._loadProgram(_Particles.drawVertex, _Particles.drawFragment);
    this._drawProgram_u_tex = gl.getUniformLocation(this._drawProgram, 'u_tex');
    this._drawProgram_a_index = gl.getUniformLocation(this._drawProgram, 'a_index');

    // Create buffers.
    const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    this._quadBuffer = this.graphics._createBuffer(QUAD);

    // Create textures.
    this._frontTexture = this.graphics._createTexture(256, 256, this.getRandomTexture(256, 256));
    this._backTexture = this.graphics._createTexture(256, 256, null);

    // Create framebuffers.
    this._framebuffer = gl.createFramebuffer();

    // Create position buffer.
    // NOTE: This is used in 'draw'.
    const positions = new Float32Array(256 * 128);
    let i = 0;
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 128; x++) {
        positions[i++] = x;
        positions[i++] = y;
      }
    }
    this._posBuffer = this.graphics._createBuffer(positions);
  }

  getRandomTexture(w, h) {

    const pixels = new Uint8Array(w * h * 4);

    for (let i = 0; i < pixels.length; i += 1) {
      pixels[i] = Math.floor(Math.random() * 256);
    }

    return pixels;
  }

  destroy() {
    const gl = this.graphics._gl;

    gl.useProgram(null);
    gl.deleteProgram(this._stepProgram);

    gl.deleteBuffer(this._quadBuffer);
    gl.deleteBuffer(this._posBuffer);

    gl.deleteFramebuffer(this._framebuffer);

    gl.deleteTexture(this._frontTexture);
    gl.deleteTexture(this._backTexture);
  }

  spawn(type, x, y, xv, yv, r, g, b, a) {

    
  }

  draw() {
    const gl = this.graphics._gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(this._drawProgram);

    // Set uniforms.
    gl.uniform1i(this._drawProgram_u_tex, 0);

    // Set texture.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._frontTexture);

    // Bind vertex data.
    gl.bindBuffer(gl.ARRAY_BUFFER, this._posBuffer);
    gl.enableVertexAttribArray(this._drawProgram_a_index);
    gl.vertexAttribPointer(this._drawProgram_a_index, 2, gl.FLOAT, false, 0, 0);

    // Draw points.
    gl.drawArrays(gl.POINTS, 0, 16384);
    
  }

  update(dT, eT) {
    const gl = this.graphics._gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._backTexture, 0);
    gl.viewport(0, 0, 256, 256);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(this._stepProgram);

    // Create texture for collisions.
    // TODO: Do this.

    // Set texture.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._frontTexture);

    // Set uniforms.
    gl.uniform1f(this._stepProgram_u_dt, dT);
    gl.uniform1i(this._stepProgram_u_tex, 0);

    // Bind vertex data.
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
    gl.enableVertexAttribArray(this._stepProgram_a_quad);
    gl.vertexAttribPointer(this._stepProgram_a_quad, 2, gl.FLOAT, false, 0, 0);

    // Draw quad.
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Swap textures.
    const temp = this._backTexture;
    this._backTexture = this._frontTexture;
    this._frontTexture = temp;

  }
}

/*
  Vertex shader.
*/
_Particles.stepVertex = `#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 a_quad;

void main() {
  gl_Position = vec4(a_quad, 0, 1.0);
}`;

/*
  Fragment shader.
*/
_Particles.stepFragment = `#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_tex;
uniform float u_dt;

const float TEX_SCALE = 0.00390625;

const float STEP_1 = 1.0;
const float STEP_2 = 0.00390625;

float decode(vec2 v) {
  return (v.x + ( v.y * 0.00390625 )) - 0.5;
}

vec2 encode(float f) {

  f += 0.5;

  f *= 256.0;
  float x = floor( f );
  f = ( f - x ) * 256.0;
  
  float y = floor( f );
  x *= 0.00390625;
  y *= 0.00390625; 
  
  return vec2( x, y );
}

vec2 decodeChannel(vec4 ch) {
  return vec2(decode(ch.rg), decode(ch.ba));
}

vec4 encodeChannel(vec2 v) {
  return vec4(encode(v.x), encode(v.y));
}

bool isPosition() {
  return mod(floor(gl_FragCoord.x), 2.0) == 0.0;
}

vec2 getValueAtOffset(float xOffset) {
  vec4 channel = texture2D(u_tex, vec2((gl_FragCoord.x + xOffset) * TEX_SCALE, gl_FragCoord.y * TEX_SCALE));
  return decodeChannel(channel);
}

void main() {
  if (isPosition()) {

    // This pixel contains a position.
    // Update it with the current velocity (stored one pixel to the right).

    vec2 pos = getValueAtOffset(0.0);
    vec2 vel = getValueAtOffset(1.0);

    vec2 dxy = vel * u_dt;
    gl_FragColor = encodeChannel(pos + dxy);

  } else {

    // This pixel contains a velocity.
    // Update it with some Gravity.
    // TODO: Check for collisions here.

    vec2 vel = getValueAtOffset(0.0);

    vec2 dvxy = vec2(0.0, -256.0) * u_dt;
    gl_FragColor = encodeChannel(vel + dvxy);

  }
}`;

/*
  Vertex shader.
*/
_Particles.drawVertex = `#ifdef GL_ES
precision mediump float;
#endif

const float TEX_SCALE = 0.00390625;

const float STEP_1 = 1.0;
const float STEP_2 = 0.00390625;

attribute vec2 a_index;
uniform sampler2D u_tex;
varying vec4 v_color;

float decode(vec2 v) {
  return v.x + ( v.y * 0.00390625 );
}

vec2 decodeChannel(vec4 ch) {
  return vec2(decode(ch.rg), decode(ch.ba));
}

vec2 getPosition(vec2 v) {
  vec4 channel = texture2D(u_tex, vec2((v.x * 2.0) * TEX_SCALE, v.y * TEX_SCALE));
  return decodeChannel(channel);
}

void main() {

  v_color = vec4(1.0, 1.0, 1.0, 1.0);

  gl_PointSize = 2.0;
  gl_Position = vec4(getPosition(a_index), 0, 1.0);

}`;

_Particles.drawFragment = `#ifdef GL_ES
precision mediump float;
#endif

varying vec4 v_color;

void main() {

  gl_FragColor = v_color;

}`;

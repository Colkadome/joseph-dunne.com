"use strict";

/*
  index.js
*/

/**
 * Game of Life simulation and display.
 * @param {HTMLCanvasElement} canvas Render target
 */
function GOL(canvas) {
  // Check arguments.
  if (!canvas) {
    console.error("Canvas is required");
    return;
  } // Check WebGL support.


  var gl = canvas.getContext("webgl");

  if (!gl) {
    console.error("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  } // Find vertex and fragment shaders.


  var vertCode = this.fetch('quad.vert');
  var fragCode = this.fetch('quad.frag');
  var stepCode = this.fetch('gol.frag'); // Init.

  this.gl = gl;
  this.timer = null;
  this.size = new Float32Array([gl.drawingBufferWidth, gl.drawingBufferHeight]);
  this.buffers = {
    quad: this.arrayBuffer(new Int8Array([-1, -1, 1, -1, -1, 1, 1, 1]))
  };
  this.programs = {
    render: this.program(vertCode, fragCode),
    step: this.program(vertCode, stepCode)
  };
  this.textures = {
    front: this.texture(gl.drawingBufferWidth, gl.drawingBufferHeight),
    back: this.texture(gl.drawingBufferWidth, gl.drawingBufferHeight)
  };
  this.frameBuffers = {
    step: this.frameBuffer()
  };
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.disable(gl.DEPTH_TEST);
  this.setRandom(0.5); //this.loadImage('./mountains-1.png');
}

;
/**
 * Fetches data from the server.
 * @returns {String} responseText
 */

GOL.prototype.fetch = function (url) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, false);
  xhr.send();
  return xhr.responseText;
};
/**
 * Creates a Frame Buffer.
 * @returns {FrameBuffer} frameBuffer
 */


GOL.prototype.frameBuffer = function (data) {
  var gl = this.gl;
  var frameBuffer = gl.createFramebuffer();
  return frameBuffer;
};
/**
 * Creates an Array Buffer.
 * @returns {Program} buffer
 */


GOL.prototype.arrayBuffer = function (data) {
  var gl = this.gl;
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buffer;
};
/**
 * Creates a program.
 * @returns {Program} shaderProgram
 */


GOL.prototype.program = function (vertCode, fragCode) {
  var gl = this.gl;
  var vertShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertShader, vertCode);
  gl.compileShader(vertShader);
  var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragShader, fragCode);
  gl.compileShader(fragShader);
  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertShader);
  gl.attachShader(shaderProgram, fragShader);
  gl.linkProgram(shaderProgram);
  return shaderProgram;
};
/**
 * Creates a blank texture.
 * @param {Integer} w width of data.
 * @param {Integer} h height of data.
 * @returns {Texture} tex
 */


GOL.prototype.texture = function (w, h) {
  w = w || 64;
  h = h || 64;
  var gl = this.gl;
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  return texture;
};
/**
 * Fill the entire state with random values.
 * @param {number} [p] Chance of a cell being alive (0.0 to 1.0)
 * @returns {GOL} this
 */


GOL.prototype.setRandom = function (p) {
  p = p == null ? 0.5 : p;
  var gl = this.gl;
  var size = this.size;
  var texture = this.textures.front;
  var len = size[0] * size[1] * 4;
  var data = new Uint8Array(len);

  for (var i = 0; i < len; i += 4) {
    var on = Math.random() < p ? 255 : 0;
    data[i] = on;
    data[i + 1] = on;
    data[i + 2] = on;
    data[i + 3] = on;
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, size[0], size[1], gl.RGBA, gl.UNSIGNED_BYTE, data);
  return this;
};
/**
 * Swaps front and back textures.
 * @returns {GOL} this
 */


GOL.prototype.swap = function () {
  var tmp = this.textures.front;
  this.textures.front = this.textures.back;
  this.textures.back = tmp;
  return this;
};
/**
 * Steps animation by rendering to the back texture using data from
 * the front texture, using the 'step' program.
 * @returns {GOL} this
 */


GOL.prototype.step = function () {
  var gl = this.gl;
  var size = this.size;
  var frameBuffer = this.frameBuffers.step;
  var sourceTexture = this.textures.front;
  var targetTexture = this.textures.back;
  var program = this.programs.step;
  var buffer = this.buffers.quad;
  gl.viewport(0, 0, size[0], size[1]);
  gl.useProgram(program); // Bind framebuffer.

  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0); // Set 'u_time'.
  //const timeLocation = gl.getUniformLocation(program, 'u_time');
  //gl.uniform1f(timeLocation, time);
  // Set 'u_texture'.

  var textureLocation = gl.getUniformLocation(program, 'u_texture');
  gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
  gl.uniform1i(textureLocation, 0); // Set 'u_texture_size'.

  var textureSizeLocation = gl.getUniformLocation(program, 'u_texture_size');
  gl.uniform2fv(textureSizeLocation, size); // Set 'a_position' attrib.

  var positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.BYTE, false, 0, 0); // Draw and swap back texture to front.

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  this.swap();
  return this;
};
/**
 * Render the Game of Life state stored in the front texture.
 * @returns {GOL} this
 */


GOL.prototype.draw = function () {
  var gl = this.gl;
  var size = this.size;
  var texture = this.textures.front;
  var program = this.programs.render;
  var buffer = this.buffers.quad;
  gl.viewport(0, 0, size[0], size[1]);
  gl.useProgram(program); // Bind default framebuffer.

  gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Set 'u_texture' uniform.

  var textureLocation = gl.getUniformLocation(program, 'u_texture');
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(textureLocation, 0); // Set 'u_texture_size'.

  var textureSizeLocation = gl.getUniformLocation(program, 'u_texture_size');
  gl.uniform2fv(textureSizeLocation, size); // Set 'a_position' attrib.

  var positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.BYTE, false, 0, 0); // Draw.

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  return this;
};
/**
 * Starts animating the simulation.
 * @returns {GOL} this
 */


GOL.prototype.start = function () {
  var gol = this;

  if (this.timer == null) {
    this.timer = setInterval(function () {
      gol.draw();
      gol.step();
    }, 60);
  }

  return this;
};
/**
 * Stop animating the simulation.
 * @returns {GOL} this
 */


GOL.prototype.stop = function () {
  clearInterval(this.timer);
  this.timer = null;
  return this;
};
/**
 * Toggle the animation state.
 * @returns {GOL} this
 */


GOL.prototype.toggle = function () {
  return this.timer == null ? this.start() : this.stop();
};
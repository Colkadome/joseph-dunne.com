'use strict';
/*
  graphics.js
*/

class _Graphics {

  constructor(canvasEl) {

    this.canvasEl = canvasEl;
    this.gl = null;
  }

  init() {

    // Check if already initialised.
    if (this.gl != null) {
      return this;
    }

    // Check if WebGL is supported.
    const gl = this.canvasEl.getContext('webgl');
    if (gl === null) {
      throw new Error('Unable to initialize WebGL.');
    }

    // Clear canvas.
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);  // Don't need this, we're not in 3D.
  
    // Set 'gl' to mark as initialised.
    this.gl = gl;
    return this;
  }

}

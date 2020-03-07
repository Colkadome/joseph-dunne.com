'use strict';
/*
  Particles.js
*/

class _Particles {

  constructor(x, y, r, g, b, a) {

    this.types = new Set(['draw', 'update', 'particle']);

    this.MAX_POINTS = 32;
    this.pos = 0;

    this.pointXY = null
    this.pointVel = null;
    this.pointColor = null;

  }

  init() {

    this.pointXY = new Float32Array(this.MAX_POINTS * 2);
    this.pointVel = new Float32Array(this.MAX_POINTS * 2);
    this.pointColor = new Float32Array(this.MAX_POINTS * 4);

    this.pos = 0;

    for (let i = 0; i < this.MAX_POINTS; i += 1) {
      this.killParticle(i);
    }
  }

  destroy() {

  }

  spawn(x, y, xv, yv, r, g, b, a) {

    const i = this.pos * 2;
    const c = this.pos * 4;

    this.pointXY[i] = x;
    this.pointXY[i + 1] = y;

    this.pointVel[i] = xv;
    this.pointVel[i + 1] = yv;

    this.pointColor[c] = r;
    this.pointColor[c + 1] = g;
    this.pointColor[c + 2] = b;
    this.pointColor[c + 3] = a;

    this.pos += 1;
    if (this.pos >= this.MAX_POINTS) {
      this.pos = 0;
    }
  }

  draw() {
    this.graphics.drawPoints(this.pointXY, this.pointColor, 0, this.MAX_POINTS);
  }

  particleIsAlive(n) {
    return this.pointColor[(n * 4) + 3] > 0;
  }

  killParticle(n) {
    this.pointColor[(n * 4) + 3] = 0;
  }

  update(dT, eT) {

    for (let n = 0; n < this.MAX_POINTS; n += 1) {
      if (!this.particleIsAlive(n)) {
        continue;
      }

      const i = n * 2;

      // Update positions.
      this.pointXY[i] += this.pointVel[i] * dT;
      this.pointXY[i + 1] += this.pointVel[i + 1] * dT;

      // Check if particle is in bounds.
      if (this.pointXY[i + 1] < 0) {
        this.killParticle(n);
        continue;
      }

      // Check if particle collides with the level.
      for (let wall of this.entities.wall) {
        if (wall.isSolidAtPosition(this.pointXY[i], this.pointXY[i + 1])) {
          this.killParticle(n);
          continue;
        }
      }

      // Update velocity.
      this.pointVel[i + 1] -= 256 * dT;

    }

  }

}

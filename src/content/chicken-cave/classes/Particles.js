'use strict';
/*
  Particles.js
*/

class _Particles {

  constructor() {

    this.types = new Set(['draw', 'update', 'particle']);

    this.MAX_POINTS = 32;
    this.pos = 0;

    this.pointType = null;
    this.pointXY = null
    this.pointVel = null;
    this.pointColor = null;

  }

  init() {

    this.pointType = new Uint8Array(this.MAX_POINTS);
    this.pointXY = new Float32Array(this.MAX_POINTS * 2);
    this.pointVel = new Float32Array(this.MAX_POINTS * 2);
    this.pointColor = new Float32Array(this.MAX_POINTS * 4);

    this.pos = 0;

    for (let i = 0; i < this.MAX_POINTS; i += 1) {
      this.killParticle(i);
    }
  }

  destroy() {

    this.pointType = null;
    this.pointXY = null
    this.pointVel = null;
    this.pointColor = null;

  }

  spawn(type, x, y, xv, yv, r, g, b, a) {

    const i = this.pos * 2;
    const c = this.pos * 4;

    this.pointType[this.pos] = type;

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

  playDripSound(x, y, speed) {
    this.sound.playSoundLazyAtPosition(
      './assets/wav/drip.wav', x, y,
      {
        playbackRate: Math.max(20, ((speed * 0.5) + 200)),
        reverb: 1,
      }
    );
  }

  update(dT, eT) {

    for (let n = 0; n < this.MAX_POINTS; n += 1) {
      if (!this.particleIsAlive(n)) {
        continue;
      }

      const i = n * 2;

      // Update positions.
      let dx = this.pointVel[i] * dT;
      let dy = this.pointVel[i + 1] * dT;

      // Check if particle is in bounds.
      if (this.pointXY[i + 1] < 0) {
        this.killParticle(n);
        continue;
      }

      // Check if particle collides with the level.
      for (let wall of this.entities.wall) {
        if (wall.isSolidAtPosition(this.pointXY[i] + dx, this.pointXY[i + 1] + dy)) {
          this.playDripSound(this.pointXY[i], this.pointXY[i + 1], this.pointVel[i + 1]);
          this.killParticle(n);
          continue;
          //dx = 0;
          //dy = 0;
          //this.pointVel[i] *= -0.1;
          //this.pointVel[i + 1] *= -0.1;
        }
      }

      // Update positions.
      this.pointXY[i] += dx;
      this.pointXY[i + 1] += dy;

      // Update velocity.
      this.pointVel[i + 1] -= 256 * dT;

    }

  }

}

// Point types.
_Particles.WATER = 1;

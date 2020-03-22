'use strict';
/*
  Particles.js
*/

class _Particles {

  constructor() {

    this.types = new Set(['draw', 'update', 'particle']);

    this.MAX_POINTS = 1024;
    this.HALF_POINTS = 512;

    this._index = 0;

    this.pointType = null;
    this.pointXY = null
    this.pointVel = null;

    this._lastSoundTime = 0;
    this._step = 0;
  }

  init() {

    this.pointType = new Uint8Array(this.MAX_POINTS);
    this.pointXY = new Float32Array(this.MAX_POINTS * 2);
    this.pointVel = new Float32Array(this.MAX_POINTS * 2);

    this._index = 0;
  }

  destroy() {

    this.pointType = null;
    this.pointXY = null
    this.pointVel = null;

  }

  spawn(type, x, y, xv, yv) {

    const i = this._index * 2;
    const c = this._index * 4;

    this.pointType[this._index] = type;

    this.pointXY[i] = x;
    this.pointXY[i + 1] = y;

    this.pointVel[i] = xv;
    this.pointVel[i + 1] = yv;

    this._index += 1;
    if (this._index >= this.MAX_POINTS) {
      this._index = 0;
    }
  }

  draw() {
    this.graphics.drawPoints(this.pointType, this.pointXY, this.pointVel, 0, this.MAX_POINTS);
  }

  particleIsAlive(n) {
    return this.pointType[n] > 0;
  }

  killParticle(n, x, y, xv, yv) {

    switch (this.pointType[n]) {
      case _Particles.WATER:
        this.playDripSound(x, y, yv);
        break;
    }

    this.pointType[n] = 0;
  }

  playDripSound(x, y, speed) {

    if (this.game.eT - this._lastSoundTime < 0.1) {
      return;
    }

    return;

    this.sound.playSoundLazyAtPosition(
      './assets/wav/drip.wav', x, y,
      {
        playbackRate: Math.max(20, ((speed * 0.5) + 200)),
        reverb: 1,
      }
    );

    this._lastSoundTime = this.game.eT;
  }

  update(dT, eT) {

    this._step = this._step === 0 ? 1 : 0;

    for (let n = 0; n < this.MAX_POINTS; n += 1) {
      if (this.pointType[n] === 0) {
        continue;
      }

      const isStep = this._step === 1 ? n >= 512 : n < 512;
      // TODO: Process only if on-screen?
      //if (isStep) {
      //  continue;
      //}

      const i = n * 2;
      const x = this.pointXY[i];
      const y = this.pointXY[i + 1];
      const xv = this.pointVel[i];// + ((Math.random() - 0.5) * 32);  // Add jiggle to unstick from walls.
      const yv = this.pointVel[i + 1];// + (Math.random() * 32);  // Add jiggle to unstick from walls.

      // Check if particle is in bounds.
      if (x < 0 || y < 0) {
        this.killParticle(n, x, y, xv, yv);
        continue;
      }

      let dx = xv * dT;
      let dy = yv * dT;

      // Check if particle collides with the level.
      let hasCollided = false;
      for (let wall of this.entities.wall) {
        if (wall.isSolidAtPosition(x + dx, y)) {

          this.pointXY[i] = (Math.round(x * 0.0625) * 16) - dx;  // Round to the nearest edge.
          this.pointVel[i] *= - Math.random();
          dx = 0;

        }
        if (wall.isSolidAtPosition(x, y + dy)) {

          this.pointXY[i + 1] = (Math.round(y * 0.0625) * 16) - dy;  // Round to the nearest edge.
          this.pointVel[i + 1] *= Math.random() * -0.1;  // Bounce a little bit to make it look foamy.
          dy = 0;

          if (yv < -24) {

            // Speed up points if they hit the ground hard.
            this.pointVel[i] *= 1.2;

          } else if (xv !== 0 && Math.abs(xv) < 12) {

            // Points travelling along the ground are given a minimum speed.
            const newSpeed = 12 + (Math.random() * 4);
            this.pointVel[i] = xv > 0 ? newSpeed : -newSpeed;

          }

        }
      }

      // Check if particle collides with moving or jumping player.
      if (!hasCollided && isStep) {
        for (let player of this.entities.player) {
          if (player.vx !== 0 || player.vy > 0) {
            if (x + dx > player.x && x + dx < player.x + 12 && y + dy > player.y && y + dy < player.y + 12) {

              let xx = Math.abs(player.x + 6 - x);
              xx *= xx;

              let yy = Math.abs(player.y + 6 - y);
              yy *= yy;

              if (xx + yy < 144) {

                dx *= -1;
                dy *= -1;

                if (player.vx !== 0) {
                  this.pointVel[i] = player.vx * 1.1;
                }

                this.pointVel[i + 1] = player.vy * 1.1;
              }

            }
          }
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
_Particles.NONE = 0;
_Particles.WATER = 1;

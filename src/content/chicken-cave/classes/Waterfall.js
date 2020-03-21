'use strict';
/*
  Waterfall.js
*/

class _Waterfall {

  constructor(opts) {
    opts = {
      x: 0,
      y: 0,
      xv: 0,
      yv: 0,
      xRange: 0,
      yRange: 0,
      rate: 1,
      ...opts,
    };

    this.types = new Set(['update']);

    this.x = opts.x;
    this.y = opts.y;
    this.xv = opts.xv;
    this.yv = opts.yv;
    this.xRange = opts.xRange;
    this.yRange = opts.yRange;
    this.rate = opts.rate;
    this.next = opts.rate;

  }

  init() {

    this.sound.playSoundLazyAtPosition(
      './assets/wav/test.m4a',
      this.x, this.y,
      {
        gain: 0.5,
        loop: true,
        loopStart: 0.5,
        loopEnd: 3,
        playbackRate: 1.5,
        reverb: 1,
      },
      (res) => {
        this._sourceNode = res.source;
        this._panNode = res.panNode;
        this._gainNode = res.gainNode;
      }
    );

  }

  destroy() {

    this._loopingSound.playing = false;

  }

  spawn() {
    for (let particle of this.entities.particle) {

      let xPos = this.x;
      let yPos = this.y;

      if (this.xRange) {
        xPos += Math.random() * this.xRange;
      }

      if (this.yRange) {
        yPos += Math.random() * this.yRange;
      }

      particle.spawn(
        _Particles.WATER,
        Math.floor(xPos), Math.floor(yPos),
        this.xv, this.yv,
      );

    }
  }

  updatePan() {
    if (this.graphics && this._panNode) {
      const camera = this.graphics.getCameraBounds();
      this._panNode.pan.value = ((this.x - camera.x) / camera.w) - 0.5;
    }
  }

  update(dT, eT) {

    // Sanity check.
    if (this.rate <= 0) {
      return;
    }

    this.next -= dT;

    while (this.next < 0) {
      this.next += this.rate;
      this.spawn();
    }

    this.updatePan();

  }
}

'use strict';
/*
  Player.js
*/

class _Droplet {

  constructor(x, y, r, g, b, a) {

    this.types = new Set(['draw', 'update']);

    this.x = x || 0;
    this.y = y || 0;
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
    this.vx = 0;
    this.vy = 0;
    this.life = 1.0;

  }

  init() {

  }

  destroy() {

  }

  draw() {
    this.graphics.drawPoint(
      this.x, this.y,
      this.r, this.g, this.b, this.a,
    );
  }

  update(dT) {

    this.x += this.vx * dT;
    this.y += this.vy * dT;

    this.vy -= 256 * dT;

    this.life -= dT;
    if (this.life <= 0) {
      this.game.deleteObject(this);
    }

  }

}

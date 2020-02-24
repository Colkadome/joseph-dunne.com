'use strict';
/*
  Player.js
*/

class _Player {

  constructor(x, y) {

    this.types = new Set(['graphics', 'update']);

    this.x = x || 0;
    this.y = y || 0;
    this.w = 32;
    this.h = 16;
    this.vx = 0;
    this.vy = 0;
    this.grounded = true;

  }

  init() {

  }

  destroy() {

  }

  draw() {


    this.graphics.drawTileLazy('./assets/img/wall.png', this.x, this.y, this.w, this.h);

    
  }

  update(dT) {

    // Check movement.
    if (this.keyboard.keyIsHeld('arrowright')) {
      this.vx = 64;
    } else if (this.keyboard.keyIsHeld('arrowleft')) {
      this.vx = -64;
    } else {
      this.vx = 0;
    }

    // Check for jump.
    if (this.grounded) {
      if (this.keyboard.keyIsDown('arrowup')) {
        this.vy = 128;
        this.grounded = false;
      }
    } else if (this.vy > -512) {
      this.vy -= 256 * dT;
    }

    // Update positions.
    this.x += this.vx * dT;
    this.y += this.vy * dT;

    // Check for collisions.
    // TODO: Do this by gathering up all the blocks that collide with the object.
    // The collision with the most crossover area will go first, then the others?
    for (let obj of this.entities.blocker) {

      const xC = this.x < (obj.x + obj.w) && (this.x + this.w) > obj.x;
      const yC = this.y < (obj.y + obj.h) && (this.y + this.h) > obj.y;

      // Check x and y collision. NOTE: collision side will be based on X vs Y amount clipped.
      if (xC && yC) {
        this.vy = 0;
        this.y = obj.y + obj.h;
        this.grounded = true;
      }
    }

  }

}

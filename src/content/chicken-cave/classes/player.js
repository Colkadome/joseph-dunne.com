'use strict';
/*
  Player.js
*/

class _Player {

  constructor(x, y) {

    this.types = new Set(['graphics', 'update']);

    this.x = x || 0;
    this.y = y || 0;
    this.vx = 0;
    this.vy = 0;
    this.direction = 1;
    this.grounded = true;

  }

  init() {

  }

  destroy() {

  }

  draw() {

    this.graphics.drawTileLazy('./assets/img/player.png',
      this.direction < 0 ? this.x + 12 : this.x,
      this.y,
      this.direction < 0 ? -12 : 12,
      14
    );
    
  }

  jumpSound() {

    this.sound.playSoundLazy('./assets/wav/intro.wav');

  }

  update(dT) {

    // Check movement.
    if (this.keyboard.keyIsHeld('arrowright')) {
      this.vx = 64;
      this.direction = 1;
    } else if (this.keyboard.keyIsHeld('arrowleft')) {
      this.vx = -64;
      this.direction = -1;
    } else {
      this.vx = 0;
    }

    // Check for jump.
    if (this.grounded) {
      if (this.keyboard.keyIsDown('z')) {
        this.vy = 128;
        this.jumpSound();
      }
    } else if (this.vy > -512) {
      this.vy -= 256 * dT;
    }

    // Update positions.
    this.x += this.vx * dT;
    this.y += this.vy * dT;

    //this.graphics.cameraX += this.vx * dT;
    //this.graphics.cameraY += this.vy * dT;

    this.grounded = false;

    // Check for boundary collisions.
    if (this.x < 0) {
      this.x = 0;
      this.vx = 0;
    }
    if (this.y < 0) {
      this.y = 0;
      this.vy = 0;
    }

    // Check for wall collisions.
    // TODO: Fix this.
    for (let obj of this.entities.wall) {

      const force = obj.getWallsAt(this.x, this.y, 12, 14);

      if (force[1] > 0) {
        this.vy = 0;
        this.grounded = true;
      }
    }

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

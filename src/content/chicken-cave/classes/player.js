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

  playJumpSound() {

    this.sound.playSoundLazy('./assets/wav/intro.wav');

  }

  update(dT) {

    // Check movement. We want to do this before updating 'x' and 'y' for responsiveness.
    if (this.keyboard.keyIsHeld('arrowright')) {
      this.vx = 128;
      this.direction = 1;
    } else if (this.keyboard.keyIsHeld('arrowleft')) {
      this.vx = -128;
      this.direction = -1;
    } else {
      this.vx = 0;
    }

    // Check for jump.
    if (this.grounded) {
      if (this.keyboard.keyIsDown('z')) {
        this.vy = 256;
        this.playJumpSound();
      }
    }
    if (this.vy > -512) {
      this.vy -= 256 * dT;
    }

    this.grounded = false;

    // Check for boundary collisions.

    let dx = this.vx * dT;
    let dy = this.vy * dT;

    if (this.x + dx < 0) {
      this.x = 0;
      this.vx = 0;
      dx = 0;
    }
    if (this.y + dy < 0) {
      this.y = 0;
      this.vy = 0;
      dy = 0;
      this.grounded = true;
    }

    // Check for wall collisions.
    if (dx || dy) {
      for (let obj of this.entities.wall) {

        const chickenSize = 12;
        const result = obj.getCollisionAt(this.x, this.y, chickenSize, chickenSize, dx, dy);

        if (result) {
          if (result.x != null) {
            dx = 0;
            this.vx = 0;
            this.v = result.x;
          }
          if (result.y != null) {
            dy = 0;
            this.vy = 0;
            this.y = result.y;
            this.grounded = true;
          }
        }
        
      }
    }

    // Update positions.
    this.x += dx;
    this.y += dy;

    // Camera.
    //this.graphics.putIntoView(this.x, this.y);

  }

}

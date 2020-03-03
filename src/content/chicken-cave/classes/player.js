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

    //this.graphics.cameraX += this.vx * dT;
    //this.graphics.cameraY += this.vy * dT;

    // Check movement. We want to do this before updating 'x' and 'y' for responsiveness.
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
        this.playJumpSound();
      }
    }
    if (this.vy > -512) {
      this.vy -= 256 * dT;
    }

    // Update positions.
    let dx = this.vx * dT;
    let dy = this.vy * dT;

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
    if (this.y <= 0) {
      this.grounded = true;
    }

    // Check for wall collisions.
    // TODO: Fix this.
    if (dx || dy) {
      for (let obj of this.entities.wall) {

        const chickenSize = 12;
        const result = obj.getCollisionAt(this.x + dx, this.y + dy, chickenSize, chickenSize, dx, dy);

        // TODO: Return an X and Y to snap to.

        if ((result & 0b01) > 0) {
          this.vx = 0;
          dx = 0;
        }
        if ((result & 0b10) > 0) {
          if (this.vy < 0) {
            this.grounded = true;
          }
          this.vy = 0;
          dy = 0;
        }
        
      }
    }

    // Update positions.
    this.x += dx;
    this.y += dy;

  }

}

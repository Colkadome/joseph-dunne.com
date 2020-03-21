'use strict';
/*
  Player.js
*/

class _Player {

  constructor(opts) {
    opts = {
      x: 0,
      y: 0,
      ...opts,
    };

    this.types = new Set(['draw', 'update', 'player']);

    this.x = opts.x;
    this.y = opts.y;
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

    this.sound.playSoundLazyAtPosition('./assets/wav/jump.wav', this.x, this.y, {
      playbackRate: 2 + (Math.random() * 0.05),
      reverb: 1,
      gain: 16,
    });

  }

  update(dT) {

    const chickenSize = 12;

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

    const maxX = (64 * 16) - chickenSize;
    const maxY = (64 * 16) - chickenSize;

    if (this.x + dx < 0) {
      this.x = 0;
      this.vx = 0;
      dx = 0;
    } else if (this.x + dx > maxX) {  // TODO: Stopping gravity working for right boundary collision.
      this.x = maxX;
      this.vx = 0;
      dx = 0;
    }
    if (this.y + dy < 0) {
      this.y = 0;
      this.vy = 0;
      dy = 0;
      this.grounded = true;
    } else if (this.y + dy > maxY) {
      this.y = maxY;
      this.vy = 0;
      dy = 0;
    }

    // Check for wall collisions.
    if (dx || dy) {
      for (let obj of this.entities.wall) {

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
    this.graphics.putIntoView(this.x, this.y);

  }

}

'use strict';
/*
  game.js
*/

class _Game {

  constructor(canvasEl, keyboard, graphics, sound) {

    // Systems.
    this.canvasEl = canvasEl;
    this.keyboard = keyboard;
    this.graphics = graphics;
    this.sound = sound;

  }

  init() {

    // Players.


    return this;
  }

  draw() {

    // Draw some tiles.
    for (let i = 0; i < 3; i++) {
      
      this.graphics.drawTileLazy('./assets/img/wall.png', i, i);

    }

    return this;
  }

  update(dT) {

    if (dT <= 0) {
      return this;
    }

    if (dT > 0.02) {
      dT = 0.02;
    }



    return this;
  }

}

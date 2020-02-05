'use strict';
/*
  game.js
*/

class _Game {

  constructor(canvasEl, keyboard, graphics, sound) {

    this.canvasEl = canvasEl;
    this.keyboard = keyboard;
    this.graphics = graphics;
    this.sound = sound;

  }

  init() {

    return this;
  }

  draw() {


    return this;
  }

  update(dT) {

    if (dT <= 0) {
      return this;
    }

    return this;
  }

}

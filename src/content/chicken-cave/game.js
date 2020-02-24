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

    // Main entities.
    this.entities = {

      // Main.
      all: new Set(),
      graphics: new Set(),
      update: new Set(),

      // Other.
      blocker: new Set(),

    };
  }

  addObject(obj) {

    this.entities.all.add(obj);
    for (let type of obj.types) {
      this.entities[type].add(obj);
    }

    obj.entities = this.entities;
    obj.keyboard = this.keyboard;
    obj.graphics = this.graphics;
    obj.sound = this.sound;
    obj.init();

    return this;
  }

  deleteObject(obj) {

    this.entities.all.delete(obj);
    for (let type of obj.types) {
      this.entities[type].delete(obj);
    }

    obj.destroy();
    obj.entities = null;
    obj.keyboard = null;
    obj.graphics = null;
    obj.sound = null;

    return this;
  }

  init() {

    // Init the first scene.
    this.addObject(new _Player(16, 16));

    this.addObject(new _Wall(0, 0));
    this.addObject(new _Wall(16, 0));
    this.addObject(new _Wall(32, 0));

    return this;
  }

  draw() {

    for (let obj of this.entities.graphics) {
      obj.draw(this.graphics);
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

    for (let obj of this.entities.update) {
      obj.update(dT);
    }

    return this;
  }

}

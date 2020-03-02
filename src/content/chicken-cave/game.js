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
      wall: new Set(),

    };

    // Other stuff.
    this.eT = 0;  // Total elapsed time since init.
  }

  addObject(obj) {

    // Add systems.
    obj.entities = this.entities;
    obj.keyboard = this.keyboard;
    obj.graphics = this.graphics;
    obj.sound = this.sound;

    // Add to entities.
    this.entities.all.add(obj);
    for (let type of obj.types) {
      if (this.entities[type]) {
        this.entities[type].add(obj);
      }
    }

    // Init.
    obj.init();

    return this;
  }

  deleteObject(obj) {

    // Destroy.
    obj.destroy();

    // Remove systems.
    obj.entities = null;
    obj.keyboard = null;
    obj.graphics = null;
    obj.sound = null;

    // Remove from entities.
    this.entities.all.delete(obj);
    for (let type of obj.types) {
      if (this.entities[type]) {
        this.entities[type].delete(obj);
      }
    }

    return this;
  }

  init() {

    // Init the first scene.
    this.addObject(new _Player(16, 16));
    this.addObject(new _LevelWalls(64, 64));

    return this;
  }

  destroy() {
    
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

    this.eT += dT;

    for (let obj of this.entities.update) {
      obj.update(dT);
    }

    return this;
  }

}

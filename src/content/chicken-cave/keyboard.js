'use strict';
/*
  keyboard.js
*/

class _Keyboard {

  constructor(controlEl) {

    this.controlEl = controlEl;

    // Keys to listen for.
    this.activeKeys = new Set([
      'arrowup',
      'arrowdown',
      'arrowleft',
      'arrowright',
      'x',
      'z',
      'shift',
    ]);

    this._keysDown = new Set();
    this._keysHeld = new Set();
    this._keysUp = new Set();

    this._init = false;
  }

  init() {
    if (this._init) {
      return this;
    }

    this.controlEl.addEventListener('keydown', this._onKeyDown.bind(this));
    this.controlEl.addEventListener('keyup', this._onKeyUp.bind(this));

    this._init = true;
    return this;
  }

  _onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (this.activeKeys.has(key)) {
      event.preventDefault();

      if (!this._keysHeld.has(key)) {
        this._keysDown.add(key);
      }
      
      this._keysHeld.add(key);
    }
  }

  _onKeyUp(event) {
    const key = event.key.toLowerCase();
    if (this.activeKeys.has(key)) {
      event.preventDefault();

      // Makes sure key is 'held' for at least 1 tick.
      if (!this._keysDown.has(key)) {
        this._keysHeld.delete(key);
      }

      this._keysUp.add(key);
    }
  }

  // Call this when the user clicks in and out of the game.
  _clear() {
    this._keysDown.clear();
    this._keysHeld.clear();
    this._keysUp.clear();
  }

  // Call this once the game is updated.
  _tick() {

    for (let key of this._keysUp) {
      this._keysHeld.delete(key);
    }

    this._keysDown.clear();
    this._keysUp.clear();
  }

  // API Methods.
  keyIsDown(key) {
    return this._keysDown.has(key);
  }
  keyIsHeld(key) {
    return this._keysHeld.has(key);
  }
  keyIsUp(key) {
    return this._keysUp.has(key);
  }
}

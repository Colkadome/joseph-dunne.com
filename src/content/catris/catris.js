'use strict';
/*
  catris.js
*/

class Catris {

  constructor(canvasEl, opts) {
    this.opts = {
      debug: false,
      ...opts,
    };

    if (!canvasEl) {
      throw new Error('Canvas Element Required');
    }

    this.canvasEl = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.paused = true;
    this.lastTime = null;
    this.TILE_SIZE = 16;
    this.GRID_WIDTH = Math.floor(canvasEl.width / this.TILE_SIZE);
    this.GRID_HEIGHT = Math.floor(canvasEl.height / this.TILE_SIZE);

    this.onRequestAnimationFrame = this.onRequestAnimationFrame.bind(this);
  }

  log(str) {
    if (this.opts.debug) {
      console.log(str);
    }
  }

  /**
   * Inits all resources for the game.
   */
  init() {
    this.log('start');

    this.images = {};
    this._loadImage('wall', './assets/img/wall.png');

    return this;
  }

  /**
   * Loads an image into an <img> element.
   */
  _loadImage(name, src) {
    const img = new Image();
    img.onload = () => {
      this.log(`Loaded '${src}'`);
      this.images[name] = img;
    };
    img.onerror = () => {
      this.log(`WARNING: Could not load '${src}'`);
    };
    img.src = src;
  }

  /**
   * Pauses the game.
   */
  pause() {
    this.log('pause');
    this.paused = true;
  }

  /**
   * Unpauses the game.
   */
  unpause() {
    this.log('unpause');
    this.paused = false;
    this.lastTime = null;
    requestAnimationFrame(this.onRequestAnimationFrame);
  }

  /**
   * Callback for elapsing time.
   */
  onRequestAnimationFrame(timestamp) {
    if (this.paused) {
      return;
    }

    const last = this.lastTime != null ? this.lastTime : timestamp;
    this.lastTime = timestamp;

    this.render();
    this.tick(timestamp - last);

    requestAnimationFrame(this.onRequestAnimationFrame);
  }

  /**
   * Ticks the game.
   */
  tick(dT) {
    if (dT <= 0) {
      return;
    }
  }

  /**
   * Renders the game.
   */
  render() {

    const canvas = this.canvasEl;
    const ctx = this.ctx;

    // Clear all.
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw left wall.
    for (let i = 0; i < this.GRID_HEIGHT; i += 1) {
      this.drawWallAt(0, i);
    }

    // Draw right wall.
    for (let i = 0; i < this.GRID_HEIGHT; i += 1) {
      this.drawWallAt(this.GRID_WIDTH - 1, i);
    }

    // Draw bottom wall.
    for (let i = 1; i < this.GRID_WIDTH; i += 1) {
      this.drawWallAt(i, this.GRID_HEIGHT - 1);
    }

  }

  drawWallAt(x, y) {
    this.drawImageAt('wall', x * this.TILE_SIZE, y * this.TILE_SIZE);
  }

  drawImageAt(name, x, y) {
    this.ctx.drawImage(this.images[name], x, y);
  }

  arrowUp() {

  }

  arrowDown() {

  }

  arrowLeft() {

  }

  arrowRight() {

  }

  spaceBar() {
    
  }
}

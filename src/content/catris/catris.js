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
    this.cursorX = null;
    this.cursorY = null;

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

    // Load images.
    this.images = {};
    this._loadImage(1, './assets/img/wall.png');
    this._loadImage(2, './assets/img/cat-u.png');
    this._loadImage(3, './assets/img/cat-d.png');
    this._loadImage(4, './assets/img/cat-l.png');
    this._loadImage(5, './assets/img/cat-r.png');

    // Init grid.
    this.grid = new Uint8Array(this.GRID_WIDTH * this.GRID_HEIGHT);

    // Init bottom with walls.
    for (let x = 0; x < this.GRID_WIDTH; x += 1) {
      this.setGrid(x, this.GRID_HEIGHT - 1, 1);
    }

    // Init sides with walls.
    for (let y = 0; y < this.GRID_HEIGHT - 1; y += 1) {
      this.setGrid(0, y, 1);
      this.setGrid(this.GRID_WIDTH - 1, y, 1);
    }

    // Add 2 random cats to the bottom.
    this.setGrid(1, this.GRID_HEIGHT - 2, 5);
    this.setGrid(2, this.GRID_HEIGHT - 2, 4);
    this.setGrid(4, this.GRID_HEIGHT - 2, 2);
    this.setGrid(4, this.GRID_HEIGHT - 3, 3);

    // Set position to spawn.
    this.cursorY = 0;
    this.cursorX = 4;
    this.toNextDown = 1;

    return this;
  }

  setGrid(x, y, n) {
    if (x >= 0 && y >= 0 && x < this.GRID_WIDTH && y < this.GRID_HEIGHT) {
      this.grid[(y * this.GRID_WIDTH) + x] = n;
    }
  }

  getGrid(x, y) {
    if (x >= 0 && y >= 0 && x < this.GRID_WIDTH && y < this.GRID_HEIGHT) {
      return this.grid[(y * this.GRID_WIDTH) + x];
    }
    return 0;
  }

  drawGrid(x, y) {
    const n = this.getGrid(x, y);
    if (n > 0) {
      const img = this.images[n];
      this.ctx.drawImage(img, x * this.TILE_SIZE, y * this.TILE_SIZE);
    }
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

    // Draw grid.
    for (let y = 0; y < this.GRID_HEIGHT; y += 1) {
      for (let x = 0; x < this.GRID_WIDTH; x += 1) {
        this.drawGrid(x, y);
      }
    }
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

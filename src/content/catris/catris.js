'use strict';
/*
  catris.js
*/

// Constants.
const NONE = 0;
const WALL = 1;
const CAT_U = 2;
const CAT_D = 3;
const CAT_L = 4;
const CAT_R = 5;

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
    this.bloodParticles = [];

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
    this._loadImage(WALL, './assets/img/wall.png');
    this._loadImage(CAT_U, './assets/img/cat-u.png');
    this._loadImage(CAT_D, './assets/img/cat-d.png');
    this._loadImage(CAT_L, './assets/img/cat-l.png');
    this._loadImage(CAT_R, './assets/img/cat-r.png');

    // Init grid.
    this.grid = new Uint8Array(this.GRID_WIDTH * this.GRID_HEIGHT);

    // Init bottom with walls.
    for (let x = 0; x < this.GRID_WIDTH; x += 1) {
      this.setGrid(x, this.GRID_HEIGHT - 1, WALL);
    }

    // Init sides with walls.
    for (let y = 0; y < this.GRID_HEIGHT - 1; y += 1) {
      this.setGrid(0, y, 1);
      this.setGrid(this.GRID_WIDTH - 1, y, WALL);
    }

    // Add 2 random cats to the bottom.
    this.setGrid(1, this.GRID_HEIGHT - 2, CAT_R);
    this.setGrid(2, this.GRID_HEIGHT - 2, CAT_L);
    this.setGrid(4, this.GRID_HEIGHT - 2, CAT_U);
    this.setGrid(4, this.GRID_HEIGHT - 3, CAT_D);

    // Set position to spawn.
    this.spawnBlock();
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
    this.tick((timestamp - last) * 0.001);

    requestAnimationFrame(this.onRequestAnimationFrame);
  }

  /**
   * Ticks the game.
   */
  tick(dT) {
    if (dT <= 0) {
      return;
    }

    this.toNextDown -= dT;
    if (this.toNextDown <= 0) {
      this.moveBlockDown();
    }

    let expired = false;
    for (let obj of this.bloodParticles) {
      obj.x -= obj.xv;
      obj.y -= obj.yv;
      obj.yv -= dT;
      obj.t -= dT;
      if (obj.t <= 0) {
        expired = true;
      }
    }
    if (expired) {
      this.bloodParticles = this.bloodParticles.filter(obj => obj.t > 0);
    }
  }

  /**
   * Moves block left. Returns true if it hits a wall.
   */
  moveBlockLeft() {

    const a = this.getGrid(this.cursorX, this.cursorY);

    if (this.getGrid(this.cursorX - 1, this.cursorY) === NONE) {

      this.setGrid(this.cursorX - 1, this.cursorY, a);

      if (a === CAT_R) {
        this.setGrid(this.cursorX, this.cursorY, CAT_L);
        this.setGrid(this.cursorX + 1, this.cursorY, NONE);
      } else {
        this.setGrid(this.cursorX, this.cursorY, NONE);
      }

      if (a === CAT_U) {
        this.setGrid(this.cursorX, this.cursorY - 1, NONE);
        this.setGrid(this.cursorX - 1, this.cursorY - 1, CAT_D);
      }

      this.cursorX -= 1;
      return false;
    }

    return true;
  }

  /**
   * Moves block left. Returns true if it hits a wall.
   */
  moveBlockRight() {

    const a = this.getGrid(this.cursorX, this.cursorY);

    if (
      this.getGrid(this.cursorX + 1, this.cursorY) === NONE
      || (
        a === CAT_R
        && this.getGrid(this.cursorX + 2, this.cursorY) === NONE
      )
    ) {

      this.setGrid(this.cursorX + 1, this.cursorY, a);
      this.setGrid(this.cursorX, this.cursorY, NONE);

      if (a === CAT_R) {
        this.setGrid(this.cursorX + 2, this.cursorY, CAT_L);
      } else if (a === CAT_U) {
        this.setGrid(this.cursorX, this.cursorY - 1, NONE);
        this.setGrid(this.cursorX + 1, this.cursorY - 1, CAT_D);
      }

      this.cursorX += 1;
      return false;
    }

    return true;
  }

  /**
   * Moves the current block downwards.
   * Returns true if the block hits a wall.
   */
  moveBlockDown() {

    let hitWall = false;
    const a = this.getGrid(this.cursorX, this.cursorY);

    if (
      this.getGrid(this.cursorX, this.cursorY + 1) !== NONE
      || (
        // Horizontal cat check.
        a === CAT_R
        && this.getGrid(this.cursorX + 1, this.cursorY + 1) !== NONE
      )
    ) {

      this.checkForCompleteRows();
      this.spawnBlock();
      hitWall = true;

    } else {

      this.setGrid(this.cursorX, this.cursorY + 1, a);
      if (a === CAT_U) {
        this.setGrid(this.cursorX, this.cursorY, CAT_D);
        this.setGrid(this.cursorX, this.cursorY - 1, NONE);
      } else {
        this.setGrid(this.cursorX, this.cursorY, 0);
      }
      if (a === CAT_R) {
        this.setGrid(this.cursorX + 1, this.cursorY + 1, CAT_L);
        this.setGrid(this.cursorX + 1, this.cursorY, NONE);
      }

      this.cursorY += 1;
    }

    this.toNextDown = 1;
    return hitWall;
  }

  /**
   * Spawns some blood at a grid location.
   */
  spawnBlood(x, y) {
    this.bloodParticles.push({
      x: x * this.TILE_SIZE + (Math.random() * this.TILE_SIZE),
      y: y * this.TILE_SIZE + (Math.random() * this.TILE_SIZE),
      xv: (Math.random() - 0.5) * 1,
      yv: (Math.random() - 0.5) * 1,
      t: 2,
    });
  }

  /**
   * Kills an entire row.
   */
  killRow(y) {
    for (let x = 1; x < this.GRID_WIDTH - 1; x += 1) {
      this.setGrid(x, y, NONE);
      this.spawnBlood(x, y);
    }
  }

  /**
   * Checks for complete rows.
   */
  checkForCompleteRows() {

    for (let y = 0; y < this.GRID_HEIGHT - 1; y += 1) {

      let complete = true;
      for (let x = 1; x < this.GRID_WIDTH - 1; x += 1) {
        if (this.getGrid(x, y) === NONE) {
          complete = false;
          break;
        }
      }

      if (complete) {
        this.killRow(y);
      }
    }
  }

  /**
   * Spawns a random block.
   */
  spawnBlock() {

    this.cursorY = 0;
    this.cursorX = 4;

    const rand = Math.floor(Math.random() * 2);
    if (rand === 0) {

      // Horizontal cat.
      this.setGrid(this.cursorX, this.cursorY, 5);
      this.setGrid(this.cursorX + 1, this.cursorY, 4);

    } else {

      // Vertical cat.
      this.setGrid(this.cursorX, this.cursorY, 2);
      this.setGrid(this.cursorX, this.cursorY - 1, 3);

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

    // Draw particles.
    for (let obj of this.bloodParticles) {
      ctx.beginPath();
      ctx.fillStyle = '#ff0000';
      ctx.rect(obj.x, obj.y, 4, 4);
      ctx.fill();
    }
  }

  arrowUp() {

  }

  arrowDown() {
    this.moveBlockDown();
  }

  arrowLeft() {
    this.moveBlockLeft();
  }

  arrowRight() {
    this.moveBlockRight();
  }

  spaceBar() {
    for (let i = 0; i < 256; i += 1) {
      if (this.moveBlockDown()) {
        return;
      }
    }
  }
}

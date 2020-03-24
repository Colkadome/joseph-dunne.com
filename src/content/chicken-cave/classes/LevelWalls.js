'use strict';
/*
  LevelWalls.js
*/

class _LevelWalls {

  constructor(opts) {
    opts = {
      w: 12,
      h: 50,
      walls: null,
      blockSize: 16,
      random: false,
      ignoreRoof: false,
      ...opts,
    };

    this.types = new Set(['draw', 'wall', 'update']);

    this.w = opts.w;
    this.h = opts.h;
    this.blockSize = opts.blockSize;
    this.blockSizeInv = 1 / opts.blockSize;
    this.walls = opts.walls;
    this.dripTimer = 0;
    this.random = opts.random;
    this.ignoreRoof = opts.ignoreRoof;
  }

  init() {

    if (this.walls == null) {
      this.walls = new Uint8Array(this.w * this.h);
    }

    if (this.random) {
      this.initRandom();
    }
    
    return this;
  }

  initRandom() {

    noise.seed(Math.random());

    // Init random walls.
    for (let y = 0; y < this.h; y += 1) {
      for (let x = 0; x < this.w; x += 1) {
        const i = (y * this.w) + x;
        this.walls[i] = noise.simplex2(x * 0.1, y * 0.2) > 0 && noise.simplex2(x * 0.2, y * 0.2) > 0.5 ? 1 : 0;
        //this.walls[i] = noise.simplex2(x * 0.1, y * 0.2) > 0 && noise.simplex2(x * 0.2, y * 0.2) > -0.5 ? 1 : 0;
      }
    }

    return this;
  }

  destroy() {

    this.walls = null;

    return this;
  }

  hasCeilingAbove(x, y) {
    return !this.isWallAt(x, y) && this.isWallAt(x, y + 1);
  }

  isWallAt(x, y) {
    return this.getWallAt(x, y) === 1;
  }

  getWallAt(x, y) {

    if (x < 0 || x > this.w - 1 || y < 0 || y > this.h - 1) {
      return 1;
    }

    return this.walls[(y * this.w) + x];
  }

  isSolidAtPosition(x, y) {

    const sizeInv = this.blockSizeInv;

    return this.isWallAt(
      Math.floor(x * sizeInv),
      Math.floor(y * sizeInv)
    );
  }

  getWallCountsAt(x, y, w, h) {

    // TODO: Use this below.

  }

  getCollisionAt(x, y, w, h, dx, dy) {

    // Accurate collision function, used for player only.

    // Get spaces that overlap with (x, y, w, h).
    // We can assume that max 4 spaces will overlap, and that (w, h) is below 16.

    //     (B, B)
    //
    // (A, A)

    const size = this.blockSize;
    const sizeInv = this.blockSizeInv;  // (1 / 16), to map coordinates to [x, y] square.

    const xA1 = Math.floor(x * sizeInv);
    const xA2 = Math.floor((x + dx) * sizeInv);

    const xB1 = Math.floor((x + w) * sizeInv);
    const xB2 = Math.floor((x + w + dx) * sizeInv);

    const yA1 = Math.floor(y * sizeInv);
    const yA2 = Math.floor((y + dy) * sizeInv);

    const yB1 = Math.floor((y + h) * sizeInv);
    const yB2 = Math.floor((y + h + dy) * sizeInv);

    let xMoved = false;
    let yMoved = false;

    let nextX = null;
    let nextY = null;

    // Check for X collisions.
    if (dx < 0 && xA2 < xA1) {
      xMoved = true;
      if (this.isWallAt(xA2, yA1) || this.isWallAt(xA2, yB1)) {
        nextX = xA1 * size;
      }
    } else if (dx > 0 && xB2 > xB1) {
      xMoved = true;
      if (this.isWallAt(xB2, yA1) || this.isWallAt(xB2, yB1)) {
        nextX = (xA2 * size) - w;
      }
    }

    // Check for Y collisions.
    if (dy < 0 && yA2 < yA1) {
      yMoved = true;
      if (this.isWallAt(xA1, yA2) || this.isWallAt(xB1, yA2)) {
        nextY = yA1 * size;
      }
    } else if (dy > 0 && yB2 > yB1) {
      yMoved = true;
      if (this.isWallAt(xA1, yB2) || this.isWallAt(xB1, yB2)) {
        nextY = (yB2 * size) - h;
      }
    }

    // If no collisions, check for corner collision.
    // We are lazy and checking all corners here.
    if (xMoved && yMoved && nextX == null && nextY == null) {
      if (
        this.isWallAt(xA2, yA2)
        || this.isWallAt(xB2, yA2)
        || this.isWallAt(xA2, yB2)
        || this.isWallAt(xB2, yB2)
      ) {
        // We choose Y collision. Is least frustrating to the player.
        nextY = dy > 0 ? (yB2 * size) - h : yA1 * size;
      }
    }

    if (nextX != null || nextY != null) {
      return {
        x: nextX,
        y: nextY,
      };
    }

    return null;
  }

  spawnDrip() {

    const size = this.blockSize;
    const sizeInv = this.blockSizeInv;
    const bounds = this.graphics.getCameraBounds();

    const xx = bounds.x + (Math.random() * bounds.w);
    const yy = bounds.y + (Math.random() * bounds.h * 1.5);  // Include more ceiling.

    const xGrid = Math.floor(xx * sizeInv);
    const yGrid = Math.floor(yy * sizeInv);

    if (this.hasCeilingAbove(xGrid, yGrid)) {
      for (let particle of this.entities.particle) {
        particle.spawn(
          _Particles.WATER,
          xx, (yGrid * size) + size,
          0, -4,
          0, 0.5, 1, 1
        );
      }
    }
  }

  update(dT) {
    if (this.dripTimer < 0) {
      //this.spawnDrip();
      this.dripTimer = -1;
    } else {
      this.dripTimer -= dT;
    }
  }

  draw() {

    const size = this.blockSize;
    const offset = size * 0.5;

    const maxY = this.ignoreRoof ? this.h : this.h + 1;

    // X and Y range extended by 1 to draw edges.
    for (let y = -1; y < maxY; y += 1) {
      for (let x = -1; x < this.w + 1; x += 1) {

        // Check if within boundaries of the grid.
        const inX = x > -1 && x < this.w;
        const inY = y > -1 && y < this.h;

        const i = (y * this.w) + x;
        const c = inX && inY ? this.walls[i] : 1;

        if (c === 1) {

          const u = inX && y < this.h - 1 ? this.walls[i + this.w] : 1;
          const d = inX && y > 0 ? this.walls[i - this.w] : 1;
          const l = inY && x > 0 ? this.walls[i - 1] : 1;
          const r = inY && x < this.w - 1 ? this.walls[i + 1] : 1;

          this.graphics.drawTileLazy(
            './assets/img/wall-1.png',
            x * size,
            y * size,
            size,
            size,
            0, 0,
            0.2, 1,
          );

          if (u !== 1) {
            this.graphics.drawTileLazy(
              './assets/img/wall-1.png',
              x * size,
              (y * size) + offset,
              size,
              size,
              0.2, 0,
              0.2, 1,
            );
          }
          if (d !== 1) {
            this.graphics.drawTileLazy(
              './assets/img/wall-1.png',
              x * size,
              (y * size) - offset,
              size,
              size,
              0.4, 0,
              0.2, 1,
            );
          }
          if (l !== 1) {
            this.graphics.drawTileLazy(
              './assets/img/wall-1.png',
              (x * size) - offset,
              y * size,
              size,
              size,
              0.6, 0,
              0.2, 1,
            );
          }
          if (r !== 1) {
            this.graphics.drawTileLazy(
              './assets/img/wall-1.png',
              (x * size) + offset,
              y * size,
              size,
              size,
              0.8, 0,
              0.2, 1,
            );
          }

        } else if (c === 2) {

          this.graphics.drawTileLazy(
            './assets/img/shroom-1.png',
            (x * size) + 2,
            y * size,
            12,
            12,
            0, 0,
            1, 1,
          );

        }
      }
    }
  }

}

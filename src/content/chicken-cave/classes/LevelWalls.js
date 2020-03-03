'use strict';
/*
  LevelWalls.js
*/

class _LevelWalls {

  constructor(w, h) {

    this.types = new Set(['graphics', 'wall']);

    this.w = w || 0;
    this.h = h || 0;
    this.walls = null;

  }

  init() {

    this.walls = new Uint8Array(this.w * this.h);

    // Init random walls.
    for (let y = 0; y < this.h; y += 1) {
      for (let x = 0; x < this.w; x += 1) {
        const i = (y * this.w) + x;
        this.walls[i] = y === 0 || Math.random() > 0.7 ? 1 : 0;
      }
    }

    // Init textures.

  }

  destroy() {

    this.walls = null;

  }

  getWallAt(x, y) {

    if (x < 0 || x > this.w - 1 || y < 0 || y > this.h - 1) {
      return 0;
    }

    return this.walls[(y * this.w) + x];
  }

  getWallCountsAt(x, y, w, h) {

    // TODO: Use this below.

  }

  getCollisionAt(x, y, w, h, dx, dy) {

    // Get spaces that overlap with (x, y, w, h).
    // We can assume that max 4 spaces will overlap, and that (w, h) is below 16.

    const size = 16;
    const scale = 0.0625;  // (1 / 16), to map coordinates to [x, y] square.
    const x1 = Math.floor(x * scale);
    const x2 = Math.floor((x + w) * scale);
    const y1 = Math.floor(y * scale);
    const y2 = Math.floor((y + h) * scale);

    // We want to nudge 'x' and 'y' back by 'dx' and 'dy' until it doesn't hit anything.

    const dl = this.getWallAt(); this.walls[(y1 * this.w) + x1] === 1;
    const dr = this.walls[(y1 * this.w) + x2] === 1;
    const ul = this.walls[(y2 * this.w) + x1] === 1;
    const ur = this.walls[(y2 * this.w) + x2] === 1;

    const collisionCount = (
      this.getWallAt(x1, y1) === 1 ? 1 : 0
      + this.getWallAt(x2, y1) === 1 ? 1 : 0
      + this.getWallAt(x1, y2) === 1 ? 1 : 0
      + this.getWallAt(x2, y2) === 1 ? 1 : 0
    );

    let result = 0;

    if (collisionCount > 0) {

      // Try and nudge horizontally.
      const xx1 = Math.floor((x - dx) * scale);
      const xx2 = Math.floor((x - dx + w) * scale);
      const xCount = (
        this.getWallAt(xx1, y1) === 1 ? 1 : 0
        + this.getWallAt(xx2, y1) === 1 ? 1 : 0
        + this.getWallAt(xx1, y2) === 1 ? 1 : 0
        + this.getWallAt(xx2, y2) === 1 ? 1 : 0
      );
      if (xCount < collisionCount) {
        result += 0b01;
      }

      // Try and nudge vertically.
      const yy1 = Math.floor((y - dy) * scale);
      const yy2 = Math.floor((y - dy + h) * scale);
      const yCount = (
        this.getWallAt(x1, yy1) === 1 ? 1 : 0
        + this.getWallAt(x2, yy1) === 1 ? 1 : 0
        + this.getWallAt(x1, yy2) === 1 ? 1 : 0
        + this.getWallAt(x2, yy2) === 1 ? 1 : 0
      );
      if (yCount < collisionCount) {
        result += 0b10;
      }

      // Try and nudge diagonally, if no collisions found.
      if (result === 0) {

        const dCount = (
          this.getWallAt(xx1, yy1) === 1 ? 1 : 0
          + this.getWallAt(xx2, yy1) === 1 ? 1 : 0
          + this.getWallAt(xx1, yy2) === 1 ? 1 : 0
          + this.getWallAt(xx2, yy2) === 1 ? 1 : 0
        );
        if (dCount < collisionCount) {
          result += 0b11;
        }

      }
    }

    return result;
  }

  draw() {

    const scale = 16;
    const offset = 8;

    for (let y = 0; y < this.h; y += 1) {
      for (let x = 0; x < this.w; x += 1) {

        const i = (y * this.w) + x;
        const c = this.walls[i];

        if (c === 1) {

          const u = y < this.h - 1 ? this.walls[i + this.w] : 0;
          const d = y > 0 ? this.walls[i - this.w] : 0;
          const l = x > 0 ? this.walls[i - 1] : 0;
          const r = x < this.w - 1 ? this.walls[i + 1] : 0;

          this.graphics.drawTileLazy(
            './assets/img/wall-1.png',
            x * scale,
            y * scale,
            scale,
            scale,
            0,
            0,
            0.2,
            1,
          );

          if (u === 0) {
            this.graphics.drawTileLazy(
              './assets/img/wall-1.png',
              x * scale,
              (y * scale) + offset,
              scale,
              scale,
              0.2,
              0,
              0.2,
              1,
            );
          }
          if (d === 0) {
            this.graphics.drawTileLazy(
              './assets/img/wall-1.png',
              x * scale,
              (y * scale) - offset,
              scale,
              scale,
              0.4,
              0,
              0.2,
              1,
            );
          }
          if (l === 0) {
            this.graphics.drawTileLazy(
              './assets/img/wall-1.png',
              (x * scale) - offset,
              y * scale,
              scale,
              scale,
              0.6,
              0,
              0.2,
              1,
            );
          }
          if (r === 0) {
            this.graphics.drawTileLazy(
              './assets/img/wall-1.png',
              (x * scale) + offset,
              y * scale,
              scale,
              scale,
              0.8,
              0,
              0.2,
              1,
            );
          }

        }
      }
    }
  }

}

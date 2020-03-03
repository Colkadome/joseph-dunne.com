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

  isWallAt(x, y) {
    return this.getWallAt(x, y) === 1;
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

    //     (B, B)
    //
    // (A, A)

    const size = 16;
    const scale = 0.0625;  // (1 / 16), to map coordinates to [x, y] square.

    const xA1 = Math.floor(x * scale);
    const xA2 = Math.floor((x + dx) * scale);

    const xB1 = Math.floor((x + w) * scale);
    const xB2 = Math.floor((x + w + dx) * scale);

    const yA1 = Math.floor(y * scale);
    const yA2 = Math.floor((y + dy) * scale);

    const yB1 = Math.floor((y + h) * scale);
    const yB2 = Math.floor((y + h + dy) * scale);

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

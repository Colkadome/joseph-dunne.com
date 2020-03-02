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

  getWallsAt(x, y, w, h) {

    const scale = 0.0625;  // (1 / 16).
    const xx = Math.floor(x * scale);
    const xx2 = Math.floor((x + w) * scale);
    const yy = Math.floor(y * scale);
    const yy2 = Math.floor((y + h) * scale);

    const result = [0, 0];

    if (this.getWallAt(xx, yy) === 1) {
      result[1] = 1;
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

'use strict';
/*
  TitleScene.js
*/

class _TitleScene {

  constructor() {

    this.types = new Set(['draw']);

  }

  getLevelWalls() {

    let walls = [
      1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1,
      1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1,
    ];

    const w = 16;
    let h = 6;

    for (let y = 0; y < 40; y += 1) {
      walls = walls.concat([1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]);
      h += 1;
    }

    for (let y = 0; y < 20; y += 1) {
      walls = walls.concat([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      h += 1;
    }

    return new _LevelWalls({
      w: w,
      h: h,
      ignoreRoof: true,
      walls: new Uint8Array(walls),
    });
  }

  init() {

    this.player = new _Player({ x: 80, y: 16 * 46 });

    this.waterfall = new _Waterfall({ x: 16, y: 80, xv: 32, yv: -32, rate: 0.02, xRange: 0, yRange: 16 });
    //this.waterfall2 = new _Waterfall({ x: 16 * 10, y: 174, xv: 40, yv: -80, rate: 0.02, xRange: 16, yRange: 0 });
    //this.waterfall3 = new _Waterfall({ x: 16 * 8, y: 142, xv: -80, yv: 10, rate: 0.02, xRange: 16, yRange: 0 });
    this.rain = new _Waterfall({ x: 0, y: 40 * 15, xv: 0, yv: -384, rate: 0.1, xRange: 16 * 16, yRange: 0 });
    this.walls = this.getLevelWalls();

    this.game
      .addObject(this.waterfall)
      //.addObject(this.waterfall2)
      //.addObject(this.waterfall3)
      .addObject(this.rain)
      .addObject(this.player)
      //.addObject(this.player2)
      .addObject(this.walls);

    return this;
  }

  destroy() {

    this.game
      .deleteObject(this.player)
      .deleteObject(this.walls)
      .deleteObject(this.waterfall);

    return this;
  }

  draw() {

    // Draw the title screen thing.
    this.graphics.drawTileLazy('./assets/img/title-graphic.png', 60, 800, 128, 64, 0, 0, 1, 1, 1.1);

  }

}

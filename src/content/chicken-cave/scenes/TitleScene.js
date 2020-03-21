'use strict';
/*
  TitleScene.js
*/

class _TitleScene {

  constructor() {



  }

  init() {

    this.player = new _Player({ x: 18, y: 16 });
    this.player2 = new _Player({ x: 32, y: 16 });

    this.waterfall = new _Waterfall({ x: 0, y: 84, xv: 20, yv: 0, rate: 0.01, xRange: 16, yRange: 0 });
    this.waterfall2 = new _Waterfall({ x: 16 * 10, y: 174, xv: 40, yv: -80, rate: 0.01, xRange: 16, yRange: 0 });
    this.rain = new _Waterfall({ x: 0, y: 26 * 16, xv: 0, yv: 0, rate: 0.1, xRange: 11 * 16, yRange: 0 });
    this.walls = new _LevelWalls({
      w: 11,
      h: 26,
      walls: new Uint8Array([
        1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
        1, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1,
        0, 0, 2, 0, 0, 0, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
      ]),
    });

    this.game
      .addObject(this.waterfall)
      .addObject(this.waterfall2)
      //.addObject(this.rain)
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

}

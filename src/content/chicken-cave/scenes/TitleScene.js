'use strict';
/*
  TitleScene.js
*/

class _TitleScene {

  constructor() {



  }

  init() {

    this.player = new _Player(0, 0);
    this.walls = new _LevelWalls(40, 20);

    this.game
      .addObject(this.player)
      .addObject(this.walls);

    return this;
  }

  destroy() {

    this.game
      .deleteObject(this.player)
      .deleteObject(this.walls);

    return this;
  }

}

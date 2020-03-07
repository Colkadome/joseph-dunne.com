'use strict';
/*
  Wall.js
*/

class _Wall {

  constructor(x, y) {

    this.types = new Set(['draw', 'blocker']);

    this.x = x || 0;
    this.y = y || 0;
    this.w = 16;
    this.h = 16;

  }

  init() {

  }

  destroy() {

  }

  draw() {

    this.graphics.drawTileLazy('./assets/img/wall.png', this.x, this.y, this.w, this.h);
    
  }

}

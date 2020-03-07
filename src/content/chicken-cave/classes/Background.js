'use strict';
/*
  Background.js
*/

class _Background {

  constructor(x, y) {

    this.types = new Set(['draw']);

  }

  init() {

  }

  destroy() {

  }

  draw() {

    const rect = this.graphics.getCameraBounds();

    this.graphics.drawTileLazy('./assets/img/background-1.png', 300, 50, rect.w * 2, rect.h * 2, 0, 0, 8, 4, 0.5);
    
  }

}

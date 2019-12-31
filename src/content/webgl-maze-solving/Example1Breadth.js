'use strict';
/*
  Example1Breadth.js
*/

class Example1Breadth {

  constructor(canvasEl) {

    if (!canvasEl) {
      throw new Error('Canvas is required');
    }
    this.canvasEl = canvasEl;
    this.canvasCtx = canvasEl.getContext('2d');

    this.grid = [];
    this.playing = false;

    this.reset();
    this.render();
  }

  reset() {

    this.grid = `wwwww
e   w
w   w
w   e
wwwww`.split('\n').map(row => row.split(''));

    this.queue = [[0, 1]];
  }

  play() {
    
    this.reset();
    this.playing = true;

  }

  step() {



  }

  render() {

    const ctx = this.canvasCtx;
    const w = this.canvasEl.width;
    const h = this.canvasEl.height;

    const gH = this.grid.length;
    const pH = h / gH;

    for (let y = 0; y < this.grid.length; y += 1) {
      for (let x = 0; x < this.grid[y].length; x += 1) {

        const gW = this.grid[y].length;
        const pW = w / gW;

        let fillStyle = '#000';
        switch (this.grid[y][x]) {
          case 'w': fillStyle = '#fff'; break;
          case 'e': fillStyle = '#f00'; break;
        }

        ctx.beginPath();
        ctx.fillStyle = fillStyle;
        ctx.fillRect(x * pW, y * pH, pW, pH);

      }
    }
  }

}

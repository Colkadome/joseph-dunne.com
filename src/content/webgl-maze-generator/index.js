'use strict';
/*
  index.js
*/

function correctCanvasResolution (canvasEl) {
  if (canvasEl && window.devicePixelRatio) {
    canvasEl.style.width = (canvasEl.width / window.devicePixelRatio) + 'px';
    canvasEl.style.height = (canvasEl.height / window.devicePixelRatio) + 'px';
  }
}

function runExample () {

  // Check for existance of classes.
  if (typeof MazeGenerator === 'undefined') {
    throw new Error('MazeGenerator not found');
  }

  // Check for canvas elements.
  const mazeCanvas = document.getElementById('maze-canvas');

  // Apply device pixel ratio canvas scaling.
  //correctCanvasResolution(mazeCanvas);

  // Create canvas objects.
  const mazeGenerator = new MazeGenerator(mazeCanvas);
  mazeGenerator.init();

  // Toggle button.
  const buttonEl = document.getElementById('play-button');
  if (buttonEl) {
    buttonEl.addEventListener('click', function (event) {
      event.preventDefault();
      mazeGenerator.play();
    }, false);
  }
}

function main () {
  runExample();
};

window.addEventListener('load', main);

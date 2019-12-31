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

function runExample1 () {

  // Check for existance of classes.
  if (typeof Example1Depth === 'undefined') {
    throw new Error('Example1Depth not found');
  }
  if (typeof Example1Breadth === 'undefined') {
    throw new Error('Example1Breadth not found');
  }

  // Check for canvas elements.
  const example1DepthCanvas = document.getElementById('example1-depth');
  const example1BreadthCanvas = document.getElementById('example1-breadth');

  // Apply device pixel ratio canvas scaling.
  correctCanvasResolution(example1DepthCanvas);
  correctCanvasResolution(example1BreadthCanvas);

  // Create canvas objects.
  const example1Depth = new Example1Depth(example1DepthCanvas);
  const example1Breadth = new Example1Breadth(example1BreadthCanvas);

  // Toggle button.
  const buttonEl = document.getElementById('example1-play-button');
  if (buttonEl) {
    buttonEl.addEventListener('click', function (event) {
      event.preventDefault();
      example1Depth.play();
      example1Breadth.play();
    }, false);
  }
}

function runExample2 () {

  // Check for existance of class.
  if (typeof Example2Breadth === 'undefined') {
    throw new Error('Example2Breadth not found');
  }

  // Check for canvas elements.
  const example2BreadthCanvas = document.getElementById('example2-breadth');

  // Apply device pixel ratio canvas scaling.
  correctCanvasResolution(example2BreadthCanvas);

  // Create canvas objects.
  const example2Breadth = new Example2Breadth(example2BreadthCanvas);

  // Toggle button.
  const buttonEl = document.getElementById('example2-play-button');
  if (buttonEl) {
    buttonEl.addEventListener('click', function (event) {
      event.preventDefault();
      example2Breadth.init();
    }, false);
  }
}

function main () {

  runExample1();
  runExample2();

};

window.addEventListener('load', main);

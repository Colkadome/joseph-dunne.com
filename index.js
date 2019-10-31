/*
  index.js
*/

function main () {

  // Check for existance of 'Gol' class.
  if (typeof Gol === 'undefined') {
    throw new Error('Gol not found.');
  }

  // Check for canvas element.
  const canvasEl = document.getElementById('gol');
  if (canvasEl == null) {
    throw new Error('Canvas element not found.');
  }

  // Init Gol.
  const gol = new Gol(canvasEl).init().draw();

};

window.onload = main;

'use strict';
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

  // Check for toggle element.
  const toggleEl = document.getElementById('toggle');
  if (toggleEl) {
    var interval = null;
    toggleEl.addEventListener('click', function (event) {
      event.preventDefault();
      if (interval != null) {
        clearInterval(interval);
        interval = null;
      } else {
        interval = setInterval(function () {
          gol.step().draw();
        }, 60);
      }
    }, false);
  }

  // Check for button element.
  const stepEl = document.getElementById('step');
  if (stepEl) {
    stepEl.addEventListener('click', function (event) {
      event.preventDefault();
      gol.step().draw();
    }, false);
  }
};

window.addEventListener('load', main);

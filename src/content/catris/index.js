'use strict';
/*
  index.js
*/

window.addEventListener('load', function () {

  // Check for existence of Catris.
  if (typeof Catris === 'undefined') {
    throw new Error('Catris not found.');
  }

  // Init Catris.
  const canvasEl = document.getElementById('catris');
  const catris = new Catris(canvasEl, { debug: true });
  catris.init();

  // Init controller.
  const controlEl = document.getElementById('catris-controller');
  const pauseTextEl = document.getElementById('pause-text');

  controlEl.addEventListener('click', function (event) {
    event.preventDefault();
    pauseTextEl.innerText = 'Click to Continue';
  }, false);

  controlEl.addEventListener('keydown', function (event) {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        catris.arrowUp();
        break;
      case 'ArrowDown':
        event.preventDefault();
        catris.arrowDown();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        catris.arrowLeft();
        break;
      case 'ArrowRight':
        event.preventDefault();
        catris.arrowRight();
        break;
      case ' ':
        event.preventDefault();
        catris.spaceBar();
        break;
    }
  }, false);

  controlEl.addEventListener('focus', function (event) {
    catris.unpause();
  }, false);

  controlEl.addEventListener('blur', function (event) {
    catris.pause();
  }, false);

}, false);

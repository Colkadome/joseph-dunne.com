'use strict';
/*
  index.js
*/

window.addEventListener('load', function () {

  // Check for existance of Catris.
  if (typeof Catris === 'undefined') {
    throw new Error('Catris not found.');
  }

  // Check for canvas element.
  const canvasEl = document.getElementById('catris');
  if (!canvasEl) {
    throw new Error('Canvas element not found.');
  }

  // Init Catris.
  const catris = new Catris(canvasEl);

}, false);

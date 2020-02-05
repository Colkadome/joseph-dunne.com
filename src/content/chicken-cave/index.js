'use strict';
/*
  index.js
*/

window.addEventListener('load', function () {

  // Check for existence of ChickenCave.
  if (typeof Game === 'undefined') {
    throw new Error('Game not found.');
  }

  const canvasEl = document.getElementById('game');
  const controlEl = document.getElementById('game-controller');
  const pauseTextEl = document.getElementById('game-text');

  // Init services.
  const keyboard = new _Keyboard(controlEl);
  keyboard.init();

  // Init game.
  const game = new Game(canvasEl, keyboard);
  game.init();
  game.draw();

  // Main loop.
  let playing = false;
  let lastTime = null;
  function step (ts) {
    if (playing) {
      if (lastTime !== null) {

        // Update game.
        game.update((ts - lastTime) * 0.001);
        game.draw();

        // Update keys.
        keyboard._tick();

      }
      lastTime = ts;
      requestAnimationFrame(step);
    }
  }

  // Add listeners.

  controlEl.addEventListener('click', function (event) {
    event.preventDefault();
    pauseTextEl.innerText = 'Click to Continue';
  });

  controlEl.addEventListener('focus', function (event) {
    keyboard._clear();
    playing = true;
    lastTime = null;
    requestAnimationFrame(step);
  });

  controlEl.addEventListener('blur', function (event) {
    keyboard._clear();
    playing = false;
    lastTime = null;
  });

});

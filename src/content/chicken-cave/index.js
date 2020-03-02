'use strict';
/*
  index.js
*/

window.addEventListener('load', function () {

  // Check for existence of components.
  if (typeof _Game === 'undefined') {
    throw new Error('_Game not found.');
  }
  if (typeof _Keyboard === 'undefined') {
    throw new Error('_Keyboard not found.');
  }
  if (typeof _Graphics === 'undefined') {
    throw new Error('_Graphics not found.');
  }
  if (typeof _Sound === 'undefined') {
    throw new Error('_Sound not found.');
  }

  // Check for existence of DOM elements.
  const canvasEl = document.getElementById('game-canvas');
  const controlEl = document.getElementById('game-controller');
  const pauseTextEl = document.getElementById('game-text');
  if (!canvasEl) {
    throw new Error('canvas element not found.');
  }
  if (!controlEl) {
    throw new Error('controller element not found.');
  }
  if (!pauseTextEl) {
    throw new Error('text element not found.');
  }

  // Init services.
  const keyboard = new _Keyboard(controlEl);
  const graphics = new _Graphics(canvasEl);
  const sound = new _Sound();
  keyboard.init();
  graphics.init();
  //sound.init();  Sound only allowed after user interaction.

  // Init game.
  const game = new _Game(canvasEl, keyboard, graphics, sound);
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

  controlEl.addEventListener('mousedown', function (event) {
    pauseTextEl.innerText = 'Click to Continue';
    sound.init();  // Sound only allowed after user interaction.
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

  window.addEventListener('unload', function(event) {

    sound.destroy();
    graphics.destroy();

  });

});

/*
  index.js
*/

window.addEventListener('load', function () {

  const options = {
    count: 100,
  };

  if (typeof Liquid === 'undefined') {
    console.log('Liquid not found');
    return;
  }

  const canvasEl = document.getElementById('liquid-canvas');
  const liquid = new Liquid(canvasEl, options);
  liquid.init();
  liquid.draw();

  let playing = false;
  let lastTime = null;
  function step(nextTime) {
    if (!playing) {
      return;
    }
    if (lastTime != null) {
      liquid.update((nextTime - lastTime) * 0.001);
      liquid.draw();
    }
    lastTime = nextTime;
    requestAnimationFrame(step);
  }

  const playButton = document.getElementById('play-button');
  playButton.addEventListener('click', function (event) {
    event.preventDefault();
    if (playing) {
      playing = false;
    } else {
      playing = true;
      requestAnimationFrame(step);
    }
  });

  const resetButton = document.getElementById('reset-button');
  resetButton.addEventListener('click', function (event) {
    event.preventDefault();
    liquid.resetParticles();
    liquid.draw();
  });

  const fullScreenButton = document.getElementById('full-screen-button');
  fullScreenButton.addEventListener('click', function (event) {
    event.preventDefault();
    canvasEl.classList.toggle('full');
  });

});

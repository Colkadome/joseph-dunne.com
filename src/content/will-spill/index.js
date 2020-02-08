/*
  index.js
*/

window.addEventListener('load', function () {

  if (typeof Liquid === 'undefined') {
    console.log('Liquid not found');
    return;
  }

  const canvasEl = document.getElementById('liquid-canvas');
  const liquid = new Liquid(canvasEl, { count: 300 });
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

  canvasEl.addEventListener('mousedown', function (event) {
    const rect = canvasEl.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    liquid.addForceAt(x, y, 100);
    liquid._willTexture = liquid._willTexture2;
  });

  canvasEl.addEventListener('mousemove', function (event) {
    const rect = canvasEl.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    liquid.addForceAt(x, y, 10);
  });

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

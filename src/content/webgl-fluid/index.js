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

  const stepButton = document.getElementById('play-button');
  stepButton.addEventListener('click', function (event) {
    event.preventDefault();
    if (playing) {
      playing = false;
    } else {
      playing = true;
      requestAnimationFrame(step);
    }
  });



});

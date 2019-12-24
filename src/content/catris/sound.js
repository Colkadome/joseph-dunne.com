'use strict';
/*
  sound.js
*/

class Sound {

  constructor(props) {

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext();

    this.buffers = {};
  }

  loadSoundFromUrl(name, url) {
    fetch(url)
      .then(res => res.arrayBuffer())
      .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        this.buffers[name] = audioBuffer;
        console.log('Loaded sound:', name);
      });
  }

  playSound(name) {
    if (this.buffers[name]) {
      const source = this.audioContext.createBufferSource();
      source.buffer = this.buffers[name];
      source.connect(this.audioContext.destination);
      source.start(0);
    }
  }

  playSquareWave(n = 1) {
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(n * 220, this.audioContext.currentTime); // value in hertz
    oscillator.connect(this.audioContext.destination);
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

}

'use strict';
/*
  sound.js
*/

class _Sound {

  constructor() {
    this.audioContext = null;
    this.buffers = new Map();
  }

  init() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext();
    return this;
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
}

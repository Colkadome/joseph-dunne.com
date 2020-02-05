'use strict';
/*
  sound.js
*/

class _Sound {

  constructor() {
    this.audioContext = null;
    this.buffers = new Map();
    this._memoize = {};
  }

  init() {
    if (this.audioContext == null) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
    }
    return this;
  }

  _playBuffer(buffer) {
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start(0);
  }

  loadSound(url) {
    if (this.audioContext != null) {
      // TODO: Memoize loading sound here.
      return fetch(url)
        .then(res => res.arrayBuffer())
        .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          this.buffers.set(url, audioBuffer);
          console.log('Loaded sound:', url);
        })
        .catch(err => {
          this.buffers.set(url, null);  // Mark the URL as failed.
          console.log('Failed to load sound:', url, err.message);
        });
    }
  }

  playSound(url) {
    if (this.audioContext != null) {
      const buffer = this.buffers.get(url);
      if (buffer != null) {
        this._playBuffer(buffer);
      }
    }
  }

  playSoundLazy(url) {
    if (this.audioContext != null) {
      if (this.buffers.has(url)) {
        return this.playSound(url);
      } else {
        return this.loadSound(url).then(() => this.playSound(url));
      }
    }
  }
}

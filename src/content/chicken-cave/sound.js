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
    if (this.audioContext == null) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
    }
    return this;
  }

  _playBuffer(buffer, opts) {
    opts = {
      pan: 0,
      gain: 1,
      loop: false,
      loopStart: 0,
      loopEnd: 0,
      start: 0,
      playbackRate: 1,
      ...opts,
    };

    console.log(opts);

    // A gain of 0 means no volume.
    if (opts.gain === 0) {
      return;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    let node = source;

    if (opts.gain != null) {
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = opts.gain;
      node.connect(gainNode);
      node = gainNode;
    }

    if (opts.pan) {
      const panNode = this.audioContext.createStereoPanner();
      panNode.pan.value = opts.pan;
      node.connect(panNode);
      node = panNode;
    }

    node.connect(this.audioContext.destination);
    source.loop = opts.loop;
    source.loopStart = opts.loopStart;
    source.loopEnd = opts.loopEnd;
    source.playbackRate.value = opts.playbackRate;
    source.start(opts.start);

    return source;
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

  playSound(url, opts) {
    if (this.audioContext != null) {
      const buffer = this.buffers.get(url);
      if (buffer != null) {
        this._playBuffer(buffer, opts);
      }
    }
  }

  playSoundLazy(url, opts) {
    if (this.audioContext != null) {
      if (this.buffers.has(url)) {
        return this.playSound(url, opts);
      } else {
        return this.loadSound(url).then(() => this.playSound(url, opts));
      }
    }
  }
}

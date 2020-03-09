'use strict';
/*
  sound.js
*/

class _Sound {

  constructor(opts) {
    opts = opts || {};
    this._logger = opts.logger;
    this.graphics = opts.graphics;

    this.audioContext = null;
    this.buffers = new Map();
    this._soundsStarted = new Set();
  }

  init() {
    if (this.audioContext == null) {

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();

      this.loadReverbTail();
    }
    return this;
  }

  loadReverbTail() {
    this._loadSound('./assets/wav/Rays.wav')
      .then(buffer => {
        this.convolver = this.audioContext.createConvolver();
        this.convolver.buffer = buffer;
      })
      .catch(err => {
        if (this._logger) {
          this._logger('Error loading convolver:', err.message);
        }
      });
  }

  destroy() {
    this.buffers.clear();
    this._soundsStarted.clear();
  }

  _tick() {
    this._soundsStarted.clear();
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
      reverb: 0,
      ...opts,
    };

    // A gain of 0 means no volume.
    if (opts.gain === 0) {
      return;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    let node = source;

    if (opts.gain !== 1) {
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

    if (opts.reverb && this.convolver) {
      const reverbNode = this.convolver;
      node.connect(reverbNode);
      node = reverbNode;
    }

    node.connect(this.audioContext.destination);
    source.loop = opts.loop;
    source.loopStart = opts.loopStart;
    source.loopEnd = opts.loopEnd;
    source.playbackRate.value = opts.playbackRate;
    source.start(opts.start);

    return source;
  }

  _loadSound(url) {

    if (this.audioContext == null) {
      throw new Error('Cannot load sound. No AudioContext:', url);
    }

    return fetch(url)
      .then(res => res.arrayBuffer())
      .then(arrayBuffer => new Promise((resolve, reject) => {
        this.audioContext.decodeAudioData(arrayBuffer, (buffer) => {
          resolve(buffer);
        }, (err) => {
          reject(err);
        });
      }));
  }

  loadSound(url) {
    this.buffers.set(url, null);  // Mark the URL as loading.
    if (this.audioContext != null) {
      // TODO: Memoize loading sound here.
      return this._loadSound(url)
        .then(audioBuffer => {
          this.buffers.set(url, audioBuffer);
          if (this._logger) {
            this._logger('Loaded sound:', url);
          }
        })
        .catch(err => {
          //this.buffers.set(url, null);  // Mark the URL as failed.
          if (this._logger) {
            this._logger('Error loading sound:', url, err.message);
          }
        });
    }
  }

  playSound(url, opts) {
    if (this.audioContext != null) {
      const buffer = this.buffers.get(url);
      if (buffer != null) {

        // Prevent same sound playing on the same frame.
        if (!this._soundsStarted.has(url)) {
          this._playBuffer(buffer, opts);
          this._soundsStarted.add(url);
        }
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

  playSoundLazyAtPosition(url, x, y, opts) {
    opts = opts || {};
    if (this.graphics) {
      const camera = this.graphics.getCameraBounds();
      opts.pan = ((x - camera.x) / camera.w) - 0.5;
      this.playSoundLazy(url, opts);
    }
  }
}

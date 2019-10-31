/*
  -------------------------------
  common.js
  -------------------------------

  Common functions for the website.
*/

/*
  scramble - takes all DOM nodes with a chosen class and animates the text.
*/

var characters = '!@#$%^&*()-_=+/?.>,<\';:[{]}\\|`~';

function getRandomCharacter () {

  return characters[Math.floor(characters.length * Math.random())];

};

function scrambleElement (el, speed) {

  var content = el.innerText;
  el.innerText = '';

  var i = 0;

  var interval = setInterval(function() {

    if (i >= content.length) {

      clearInterval(interval);
      el.innerText = content;

    } else {

      el.innerText = content.substring(0, i) + getRandomCharacter();
      i += 1;

    }

  }, speed);

};

function scrambleAll (className, speed) {

  var els = document.getElementsByClassName(className);

  for (var i = 0; i < els.length; i++) {
    scrambleElement(els[i], speed);
  }
};

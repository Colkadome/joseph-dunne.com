'use strict';
/*
  -------------------------------
  common.js
  -------------------------------
*/

/*
  THEME.
*/

function loadTheme () {
  try {
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark');
    }
  } catch (err) { }
}
function toggleTheme () {
  var added = document.body.classList.toggle('dark');
  try {
    if (added) {
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.removeItem('theme');
    }
  } catch (err) { }
}

/*
  THEME BUTTON.
*/

function activateToggleButton () {
  var el = document.getElementById('toggle-theme');
  if (el) {
    el.addEventListener('click', function (event) {
      toggleTheme();
    }, false);
  }
}

/*
  SCRAMBLE.

  takes all DOM nodes with a chosen class and animates the text.
*/

function getRandomCharacter () {
  var characters = '!@#$%^&*()-_=+/?.>,<\';:[{]}\\|`~';
  return characters[Math.floor(characters.length * Math.random())];
}

function scrambleElement (el, speed) {

  var content = el.innerText;
  el.innerText = getRandomCharacter();  // Needs to start with 1 character to stop jumping.

  var i = 1;
  var interval = setInterval(function() {
    if (i >= content.length) {

      clearInterval(interval);
      el.innerText = content;

    } else {

      el.innerText = content.substring(0, i) + getRandomCharacter();
      i += 1;

    }
  }, speed);
}

function scrambleAll (query, speed) {
  var els = document.querySelectorAll(query);
  for (var i = 0; i < els.length; i++) {
    scrambleElement(els[i], speed);
  }
}

/*
  INIT.
*/

window.addEventListener('load', function () {
  scrambleAll('.scramble', 10);
  document.body.classList.add('transition');
  activateToggleButton();
});

// Theme is loaded immediately to stop flickering.
loadTheme();

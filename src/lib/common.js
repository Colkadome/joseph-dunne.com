'use strict';
/*
  -------------------------------
  common.js
  -------------------------------

  Common functions for the website.
*/

/*
  Class toggling helpers.
*/
function getClasses (el) {
  return el.className ? el.className.split(' ') : [];
}
function addClass (el, cls) {
  var classes = getClasses(el);
  var index = classes.indexOf(cls);
  if (index < 0) {
    classes.push(cls);
    el.className = classes.join(' ');
    return true;
  }
  return false;
}
function removeClass (el, cls) {
  var classes = getClasses(el);
  var index = classes.indexOf(cls);
  if (index >= 0) {
    classes.splice(index, 1);
    el.className = classes.join(' ');
    return true;
  }
  return false;
}
function toggleClass (el, cls) {
  var classes = getClasses(el);
  var index = classes.indexOf(cls);
  if (index < 0) {
    classes.push(cls);
  } else {
    classes.splice(index, 1);
  }
  el.className = classes.join(' ');
  return index < 0;
}

/*
  Theme helpers.
*/
function loadTheme () {
  try {
    if (localStorage.getItem('theme') === 'dark') {
      addClass(document.body, 'dark');
    }
  } catch (err) {

  }
}
function toggleTheme () {
  var added = toggleClass(document.body, 'dark');
  try {
    if (added) {
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.removeItem('theme');
    }
  } catch (err) {

  }
}

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

function scrambleAll (query, speed) {

  var els = document.querySelectorAll(query);

  for (var i = 0; i < els.length; i++) {
    scrambleElement(els[i], speed);
  }
};

/*
  Theme toggling.
*/

function toggleClass (el, str) {
  var classes = el.className ? el.className.split(' ') : [];
  var index = classes.indexOf(str);
  if (index >= 0) {
    classes.splice(index, 1);
  } else {
    classes.push(str);
  }
  el.className = classes.join(' ');
  return index < 0;
}

function activateToggleTheme () {

  var buttonEl = document.getElementById('toggle-theme');
  if (!buttonEl) {
    return;
  }

  buttonEl.addEventListener('click', function (event) {
    event.preventDefault();
    toggleTheme();
  }, false);
}

/*
  Onload.
*/

window.addEventListener('load', function () {
  scrambleAll('.scramble', 10);
  activateToggleTheme();
  loadTheme();
});

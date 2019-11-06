'use strict';
/*
  -------------------------------
  common.js
  -------------------------------

  Common functions for the website.
*/

/*
  COMPONENTS.
*/
class ToggleThemeButton extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {

    const button = document.createElement('button');
    button.classList.add('toggle-theme');
    button.addEventListener('click', function (event) {
      event.preventDefault();
      toggleTheme();
    }, false);

    this.appendChild(button);
  }
}
customElements.define('toggle-theme-button', ToggleThemeButton);

class TopNavbar extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.innerHTML = `<nav class="navbar">
      <ul>
        <li><a href="/" class="button secondary">Home</a></li>
        <li><a href="/pages" class="button secondary">Pages</a></li>
      </ul>
    </nav>`;
  }
}
customElements.define('top-navbar', TopNavbar);

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

/*
  Onload.
*/
window.addEventListener('load', function () {
  scrambleAll('.scramble', 10);
  addClass(document.body, 'transition');
});

// Theme is loaded immediately to stop flickering.
loadTheme();

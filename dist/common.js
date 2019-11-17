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

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _construct(Parent, args, Class) { if (isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var ToggleThemeButton =
/*#__PURE__*/
function (_HTMLElement) {
  _inherits(ToggleThemeButton, _HTMLElement);

  function ToggleThemeButton() {
    _classCallCheck(this, ToggleThemeButton);

    return _possibleConstructorReturn(this, _getPrototypeOf(ToggleThemeButton).call(this));
  }

  _createClass(ToggleThemeButton, [{
    key: "connectedCallback",
    value: function connectedCallback() {
      var button = document.createElement('button');
      button.classList.add('toggle-theme');
      button.addEventListener('click', function (event) {
        event.preventDefault();
        toggleTheme();
      }, false);
      this.appendChild(button);
    }
  }]);

  return ToggleThemeButton;
}(_wrapNativeSuper(HTMLElement));

customElements.define('toggle-theme-button', ToggleThemeButton);

var TopNavbar =
/*#__PURE__*/
function (_HTMLElement2) {
  _inherits(TopNavbar, _HTMLElement2);

  function TopNavbar() {
    _classCallCheck(this, TopNavbar);

    return _possibleConstructorReturn(this, _getPrototypeOf(TopNavbar).call(this));
  }

  _createClass(TopNavbar, [{
    key: "connectedCallback",
    value: function connectedCallback() {
      this.innerHTML = "<nav class=\"navbar\">\n      <ul>\n        <li><a href=\"/\" class=\"button secondary\">Home</a></li>\n        <li><a href=\"/pages\" class=\"button secondary\">Pages</a></li>\n      </ul>\n    </nav>";
    }
  }]);

  return TopNavbar;
}(_wrapNativeSuper(HTMLElement));

customElements.define('top-navbar', TopNavbar);
/*
  Class toggling helpers.
*/

function getClasses(el) {
  return el.className ? el.className.split(' ') : [];
}

function addClass(el, cls) {
  var classes = getClasses(el);
  var index = classes.indexOf(cls);

  if (index < 0) {
    classes.push(cls);
    el.className = classes.join(' ');
    return true;
  }

  return false;
}

function removeClass(el, cls) {
  var classes = getClasses(el);
  var index = classes.indexOf(cls);

  if (index >= 0) {
    classes.splice(index, 1);
    el.className = classes.join(' ');
    return true;
  }

  return false;
}

function toggleClass(el, cls) {
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


function loadTheme() {
  try {
    if (localStorage.getItem('theme') === 'dark') {
      addClass(document.body, 'dark');
    }
  } catch (err) {}
}

function toggleTheme() {
  var added = toggleClass(document.body, 'dark');

  try {
    if (added) {
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.removeItem('theme');
    }
  } catch (err) {}
}
/*
  scramble - takes all DOM nodes with a chosen class and animates the text.
*/


var characters = '!@#$%^&*()-_=+/?.>,<\';:[{]}\\|`~';

function getRandomCharacter() {
  return characters[Math.floor(characters.length * Math.random())];
}

;

function scrambleElement(el, speed) {
  var content = el.innerText;
  el.innerText = getRandomCharacter(); // Needs to start with 1 character to stop jumping.

  var i = 1;
  var interval = setInterval(function () {
    if (i >= content.length) {
      clearInterval(interval);
      el.innerText = content;
    } else {
      el.innerText = content.substring(0, i) + getRandomCharacter();
      i += 1;
    }
  }, speed);
}

;

function scrambleAll(query, speed) {
  var els = document.querySelectorAll(query);

  for (var i = 0; i < els.length; i++) {
    scrambleElement(els[i], speed);
  }
}

;
/*
  Onload.
*/

window.addEventListener('load', function () {
  scrambleAll('.scramble', 10);
  addClass(document.body, 'transition');
}); // Theme is loaded immediately to stop flickering.

loadTheme();
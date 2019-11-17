"use strict";

/*
  index.js
*/
window.onload = function () {
  // Welcome message.
  console.log("    __ ____\n __|  |    \\\n|  |  |  |  |\n|_____|____/ 404 - NOT FOUND"); // Run some fun functions.

  scrambleAll('scramble', 20); // Start GOL.

  var canvasEl = document.getElementById('gol');
  var gol = new GOL(canvasEl).start();
};
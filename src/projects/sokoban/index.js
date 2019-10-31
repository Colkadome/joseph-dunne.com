/*
  index.js
*/

window.onload = function () {

  // Welcome message.

  console.log("    __ ____\n __|  |    \\\n|  |  |  |  |\n|_____|____/ PROJECTS - SOKOBAN");

  // Run some fun functions.

  scrambleAll('scramble', 20);

  // Check for element.

  var elId = 'sokoban';
  var el = document.getElementById(elId);

  if (!el) {
    console.log("Sokoban: Element with " + elId + " not found.");
    return;
  }

  // Initialise Sokoban game.

  new Sokoban(el);

};

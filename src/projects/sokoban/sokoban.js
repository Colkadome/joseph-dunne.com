/*
  sokoban.js

  A simple Sokoban game.
*/

// Symbols map.

var types = {
  empty: ' ',
  wall: '#',
  trap: '.',
  box: '$',
  boxOverTrap: '*',
  player: '@',
  playerOverTrap: '+',
  newLine: '\n'
};

var display = {
  empty: '<img src="./img/empty.svg">',
  wall: '<img src="./img/wall.svg">',
  trap: '<img src="./img/trap.svg">',
  box: '<img src="./img/box.svg">',
  boxOverTrap: '<img src="./img/box-over-trap.svg">',
  player: '<img src="./img/player.svg">',
  playerOverTrap: '<img src="./img/player-over-trap.svg">',
  newLine: '<br>',
  void: '<img src="./img/wall.svg">'
};

// Main Sokoban class.

function Sokoban(el, levelData) {

  this.el = el;
  this.loadLevel(levelData || '####\n# .#\n#  ###\n#*@  #\n#  $ #\n#  ###\n####');

  // Add some listeners.

  this.el.addEventListener('keydown', this.onKeyDown.bind(this), false);

};

// Loading level functions.

Sokoban.prototype.loadLevel = function(levelData) {

  this.level = levelData;
  this._level = levelData;
  this.atMove = 0;
  this.history = [];

  this.updateHtml();

};

// UI functions.

Sokoban.prototype.getNode = function(c) {
  switch (c) {
    case types.empty: return display.empty;
    case types.wall: return display.wall;
    case types.trap: return display.trap;
    case types.box: return display.box;
    case types.boxOverTrap: return display.boxOverTrap;
    case types.player: return display.player;
    case types.playerOverTrap: return display.playerOverTrap;
    case types.newLine: return display.newLine;
    default: return display.void;
  }
};

Sokoban.prototype.updateHtml = function() {

  var str = '';

  for (let i = 0; i < this.level.length; i++) {
    str += this.getNode(this.level[i]);
  }

  if (this.levelIsPassed()) {
    str += '<br>Level Passed';    
  }

  this.el.innerHTML = str;

};

Sokoban.prototype.levelIsPassed = function() {

  return this.level.indexOf(types.box) < 0;

};

Sokoban.prototype.setItemAt = function(x, y, item) {

  if (x < 0 || y < 0) {
    return types.wall;
  }

  var grid = this.level.split('\n');

  if (y >= grid.length) {
    return types.wall;
  }

  if (x >= grid[y].length) {
    return types.wall;
  }

  grid[y] = grid[y].substr(0, x) + item + grid[y].substr(x + 1);

  this.level = grid.join('\n');

};

Sokoban.prototype.getItemAt = function(x, y) {

  if (x < 0 || y < 0) {
    return types.wall;
  }

  var grid = this.level.split('\n');

  if (y >= grid.length) {
    return types.wall;
  }

  if (x >= grid[y].length) {
    return types.wall;
  }

  return grid[y][x];

};

Sokoban.prototype.findPlayerPosition = function() {

  var x = 0;
  var y = 0;

  for (var i = 0; i < this.level.length; i++) {

    if (this.level[i] === types.player || this.level[i] === types.playerOverTrap) {

      break;

    } else if (this.level[i] === '\n') {

      y += 1;
      x = 0;

    } else {

      x += 1;

    }
  }

  return [x, y];

};

Sokoban.prototype.moveDir = function(xDir, yDir) {

  var playerPos = this.findPlayerPosition();

  var pX = playerPos[0];
  var pY = playerPos[1];
  var p = this.getItemAt(pX, pY);

  var x = pX + xDir;
  var y = pY + yDir;
  var b = this.getItemAt(x, y);

  var moved = false;
  var pushed = false;

  if (b === types.empty || b === types.trap) {

    this.setItemAt(x, y, b === types.trap ? types.playerOverTrap : types.player);
    this.setItemAt(pX, pY, p === types.playerOverTrap ? types.trap : types.empty);

    moved = true;

  } else if (b === types.box || b === types.boxOverTrap) {

    var xx = x + xDir;
    var yy = y + yDir;
    var bb = this.getItemAt(xx, yy);

    if (bb === types.empty || bb === types.trap) {

      this.setItemAt(xx, yy, bb === types.trap ? types.boxOverTrap : types.box);
      this.setItemAt(x, y, b === types.boxOverTrap ? types.playerOverTrap : types.player);
      this.setItemAt(pX, pY, p === types.playerOverTrap ? types.trap : types.empty);

      moved = true;
      pushed = true;
    }
  }

  if (moved) {

    this.atMove += 1;

    this.history.length = this.atMove;
    this.history[this.atMove - 1] = [xDir, yDir, pushed];

    this.updateHtml();
  }
};

Sokoban.prototype.moveUp = function() {
  this.moveDir(0, -1);
};

Sokoban.prototype.moveDown = function() {
  this.moveDir(0, 1);
};

Sokoban.prototype.moveLeft = function() {
  this.moveDir(-1, 0);
};

Sokoban.prototype.moveRight = function() {
  this.moveDir(1, 0);
};

// Undo and Redo.

Sokoban.prototype.undoMove = function() {

  if (this.atMove === 0) {
    return;
  }

  var move = this.history[this.atMove - 1];

  var xDir = move[0];
  var yDir = move[1];
  var pushed = move[2];

  // Player position after move.
  var playerPos = this.findPlayerPosition();
  var pX = playerPos[0];
  var pY = playerPos[1];
  var p = this.getItemAt(pX, pY);

  // Item behind player.
  var rX = pX - xDir;
  var rY = pY - yDir;
  var r = this.getItemAt(rX, rY);

  // Move player backwards.

  this.setItemAt(rX, rY, r === types.trap ? types.playerOverTrap : types.player);

  if (pushed) {

    // Item infront of player.
    var fX = pX + xDir;
    var fY = pY + yDir;
    var f = this.getItemAt(fX, fY);

    if (f === types.boxOverTrap || f === types.box) {
      this.setItemAt(pX, pY, p === types.playerOverTrap ? types.boxOverTrap : types.box);
      this.setItemAt(fX, fY, f === types.boxOverTrap ? types.trap : types.empty);
    }

  } else {

    this.setItemAt(pX, pY, p === types.playerOverTrap ? types.trap : types.empty);

  }

  this.atMove -= 1;
  this.updateHtml();
  
};

Sokoban.prototype.redoMove = function() {

  if (this.atMove > this.history.length - 1) {
    return;
  }

  var move = this.history[this.atMove];
  var xDir = move[0];
  var yDir = move[1];

  var playerPos = this.findPlayerPosition();
  var pX = playerPos[0];
  var pY = playerPos[1];
  var p = this.getItemAt(pX, pY);

  var x = pX + xDir;
  var y = pY + yDir;
  var b = this.getItemAt(x, y);

  if (b === types.empty || b === types.trap) {

    this.setItemAt(x, y, b === types.trap ? types.playerOverTrap : types.player);
    this.setItemAt(pX, pY, p === types.playerOverTrap ? types.trap : types.empty);

  } else if (b === types.box || b === types.boxOverTrap) {

    var xx = x + xDir;
    var yy = y + yDir;
    var bb = this.getItemAt(xx, yy);

    if (bb === types.empty || bb === types.trap) {

      this.setItemAt(xx, yy, bb === types.trap ? types.boxOverTrap : types.box);
      this.setItemAt(x, y, b === types.boxOverTrap ? types.playerOverTrap : types.player);
      this.setItemAt(pX, pY, p === types.playerOverTrap ? types.trap : types.empty);
    }
  }

  this.updateHtml();
  this.atMove += 1;
  
};

Sokoban.prototype.restartLevel = function() {
  this.loadLevel(this._level);
};

// Keydown callback.

Sokoban.prototype.onKeyDown = function(event) {
  switch (event.key) {

    case 'ArrowUp':
    case 'w':
      this.moveUp();
      break;

    case 'ArrowDown':
    case 's':
      this.moveDown();
      break;

    case 'ArrowLeft':
    case 'a':
      this.moveLeft();
      break;

    case 'ArrowRight':
    case 'd':
      this.moveRight();
      break;

    case 'z':
      this.undoMove();
      break;

    case 'x':
      this.redoMove();
      break;

    case 'r':
      this.restartLevel();
      break;

  }
};

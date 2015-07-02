var socket = io();

var RADIUS = 50;

var canvas;
var stat;
var ctx;
var id = "";

var down = false;
var prevX, prevY;
var x = 0, y = 0;

var max_height = 0;

var user_pos = {};
var lines = [];


stat = document.getElementById("status");
canvas = document.getElementById("theCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx = canvas.getContext("2d");

socket.on('init', function(msg) {
	console.log("ID RECEIVED: " + msg.id);
	id = msg.id;
	lines = msg.lines;
});

socket.on('pos', function(msg) {
	user_pos = msg;
	x = user_pos[id].x;
	y = user_pos[id].y;
});

socket.on('newLine', function(msg) {
  lines.push(msg);
});

addEventListener("mousedown", downHandler, true);
addEventListener("mouseup", upHandler, true);
addEventListener("mousemove", moveHandler, true);
addEventListener("keydown", keyDownHandler, true);

animLoop();


function downHandler(e) {
  down = true;
  
  prevX = e.pageX;
  prevY = transMouseY(e.pageY);
  
  e.preventDefault();
}

function upHandler(e) {
  down = false;
  prevX = null;
  prevY = null;
  e.preventDefault();
}

function moveHandler(e) {
  if (down) {
    var y_trans = transMouseY(e.pageY);
    var line = new Line(prevX, prevY, e.pageX, y_trans);
    lines.push(line);
    socket.emit('addLine', line);
    prevX = event.pageX;
    prevY = y_trans;
  }
  else {
    socket.emit('mousePos', {x: e.pageX, y: e.pageY});
  }
}

function transMouseY(mouseY) {
  var h = window.innerHeight;
  var y_trans = 0;
  if (y < h/2) {
    y_trans = h - mouseY;
  }
  else {
    y_trans = y - (mouseY - h/2);
  }
  return y_trans;
}

function keyDownHandler(event) {
	// Space == 32
	if (event.keyCode == 32) {
		socket.emit('jump');
	}
	return false;
}

function drawBall(ball_x, ball_y, colour) {
  ctx.beginPath();
  ctx.arc(ball_x, ball_y, RADIUS, 0, 2 * Math.PI, false);
  ctx.fillStyle = colour;
  //ctx.fillStyle = collided ? 'red' : 'blue';
  ctx.fill();
  ctx.lineWidth = "5";
  ctx.strokeStyle = "midnightBlue";
  ctx.stroke();
}

function drawStuff() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var h = window.innerHeight;
  var y_trans = 0;
  if (y < h/2) {
    y_trans = 0;
  }
  else {
    y_trans = (y - h/2);
  }
  
  // Draw lines and other players on height-translated canvas
  ctx.translate(0, y_trans);
  // Lines
  for (var i = 0; i < lines.length; i++) {
    ctx.beginPath();
    ctx.moveTo(lines[i].x1, h - lines[i].y1);
    ctx.lineTo(lines[i].x2, h - lines[i].y2);
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.closePath();
  }
  // Balls
  for (var key in user_pos) {
  	if (key != id) {
  		drawBall(user_pos[key].x, window.innerHeight - user_pos[key].y, "lightBlue");
  		var speed = user_pos[key].vx + user_pos[key].vy;
  		if (speed > 50) {
	  		user_pos[key].x += user_pos[key].vx/2;
	  		user_pos[key].y += user_pos[key].vy/2;
  		}
  	}
  }
  ctx.translate(0, -y_trans);
  
  // Draw player's ball absolutely
  var ball_y = 0;
  if (y < (window.innerHeight)/2) {
    ball_y = window.innerHeight - y;
  }
  else {
    ball_y = window.innerHeight / 2;
  }

  drawBall(x, ball_y, "red");
}

function updateStatus() {
	stat.innerText = "Height:\t" + Math.round(y - RADIUS);
  if (y > max_height) {
    max_height = y;
  }
  stat.innerText += "\nBest:\t" + Math.round(max_height);
}

function animLoop() {
  requestAnimationFrame(animLoop);
  drawStuff();
  updateStatus();
}

// Class declarations
function Line(x1, y1, x2, y2) {
  this.x1 = x1;
  this.y1 = y1;
  this.x2 = x2;
  this.y2 = y2;
}

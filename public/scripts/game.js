var socket = io();

var RADIUS = 50;

var canvas;
var ctx;
var id = "";

var down = false;
var prevX, prevY;
var x = 0, y = 0;

var user_pos = {};
var lines = [];


canvas = document.getElementById("theCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx = canvas.getContext("2d");

socket.on('init', function(msg) {
	console.log("ID RECEIVED: " + msg);
	id = msg;
});

socket.on('pos', function(msg) {
	user_pos = msg;
	x = user_pos[id].x;
	y = user_pos[id].y;
});

addEventListener("mousemove", moveHandler, true);
addEventListener("keydown", keyDownHandler, true);

animLoop();


function moveHandler(e) {
	socket.emit('mousePos', {x: e.pageX, y: e.pageY});
}

function keyDownHandler(event) {
	// Space == 32
	if (event.keyCode == 32) {
		socket.emit('jump');
	}
	return false;
}

function drawBall(ball_x, ball_y) {
  ctx.beginPath();
  ctx.arc(ball_x, ball_y, RADIUS, 0, 2 * Math.PI, false);
  ctx.fillStyle = "lightBlue";
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
  		drawBall(user_pos[key].x, window.innerHeight - user_pos[key].y);
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

  drawBall(x, ball_y);
}

function animLoop() {
  requestAnimationFrame(animLoop);
  drawStuff();
}

var socket = io();

var canvas;
var ctx;
var colour = "black";

var down = false;
var prevX, prevY;

var userMap = {};

function onLoad() {

	canvas = document.getElementById("theCanvas");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	ctx = canvas.getContext("2d");

//	ctx.moveTo(0, 0);

	socket.on('colour', function(msg) {
		colour = msg;
	});

	socket.on('init', function(msg) {
		ctx.beginPath();
		for (i in msg) {
			console.log("=== " + msg[i].x + " " + msg[i].y + " " + msg[i].released);
			if (msg[i].released) {
				pathRelease(msg[i]);
			}
			else {
				pathMove(msg[i]);
			}
		}
	});

	socket.on('move', pathMove);

	socket.on('clear', clearBoard);

	socket.on('users', function(msg) {
		document.getElementById("counter_text").innerText = msg;
	});

	socket.on('release', pathRelease);

	addEventListener("mousedown", downHandler, true);
	addEventListener("touchstart", downHandler, true);
	addEventListener("mouseup", upHandler, true);
	addEventListener("touchend", upHandler, true);
	addEventListener("mousemove", moveHandler, true);
	addEventListener("touchmove", moveHandler, true);
}

function pathMove(msg) {
	if (userMap[msg.id] == null) {
		ctx.beginPath();
	}
	else {
		var user = userMap[msg.id];
		ctx.moveTo(user.x, user.y);
	}
	userMap[msg.id] = msg;
	ctx.lineTo(msg.x, msg.y);
	ctx.stroke();
}

function pathRelease(msg) {
	if (msg.id in userMap) {
		userMap[msg.id] = null;
	}
}

function clearHandler() {
	clearBoard();
	socket.emit('clear');
}

function clearBoard() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	userMap = {};
	ctx.beginPath();
}

function downHandler(e) {
//	document.getElementById("eventBox").innerText = "down " + e.type;
	var x, y;
	if (e.type == "touchstart") {
		x = e.changedTouches[0].pageX;
		y = e.changedTouches[0].pageY;
	}
	else {
		x = e.pageX;
		y = e.pageY;
	}
	prevX = x;
	prevY = y;
	ctx.moveTo(x, y);
	down = true;
	e.preventDefault();
}

function upHandler(e) {
//	document.getElementById("eventBox").innerText = "up " + e.type;
	down = false;
	socket.emit('release');
	e.preventDefault();
}

function moveHandler(e) {
//	document.getElementById("eventBox").innerText = "move " + e.type;
	var x, y;
	if (e.type == "touchmove") {
		x = e.changedTouches[0].pageX;
		y = e.changedTouches[0].pageY;
	}
	else {
		x = e.pageX;
		y = e.pageY;
	}
	if (down) {
			// Necessary to move context in case someone else is drawing at same time as us
			ctx.moveTo(prevX, prevY);
			ctx.lineTo(x, y);
			ctx.stroke();

			var jsonData = {x: x, y: y};
			prevX = x;
			prevY = y;

			socket.emit('move', jsonData);
	}
	e.preventDefault();
}
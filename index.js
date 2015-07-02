var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Constants
var GRAVITY = -0.3;
var RADIUS = 50;
var INITIAL_X = 900;
var INITIAL_Y = RADIUS + 10;
var MAP_WIDTH = 1920;
var MAP_HEIGHT = 1080;
var PERIOD = 20;

// Game state
var num_users;
var user_pos = {};
var lines = [new Line(0, 0, MAP_WIDTH, 0), new Line(0, 0, 100, 100), new Line(250, 250, 1000, 1000)];

app.set('port', (process.env.PORT || 5000));

app.use(express.static('public'));

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
	console.log('a user connected');

	num_users++;

  var id = socket.id;
	console.log('User id: ' + id);
	user_pos[id] = {x: INITIAL_X, y: INITIAL_Y, vx: 0, vy: 0, ax: 0, ay: 0, collided: false};

	socket.emit('init', {id: id, lines: lines});

	socket.on('mousePos', function(msg) {
		//console.log(socket.id + " mousePos: " + msg);
		var user = user_pos[socket.id];
    user.vx = -0.05*(user.x - msg.x);
	});

  socket.on('addLine', function(msg) {
    // Construct new line rather than trusting the given object to be a valid line
    var line = new Line(msg.x1, msg.y1, msg.x2, msg.y2);
    lines.push(line);
    socket.broadcast.emit('newLine', line);
  });

	socket.on('jump', function(msg) {
		console.log(socket.id + " jumped");
    var user = user_pos[socket.id];

    if (user.collided) {
      user.vy = 10;
      user.y += 2;
    }
	});

	socket.on('disconnect', function() {
		console.log('a user disconnected');
		delete user_pos[socket.id];
		num_users--;
	});

});

http.listen(app.get('port'), function() {
  console.log('Running on port', app.get('port'));
});

// Start running simulation!
setInterval(animLoop, PERIOD);


function detectCollisions(p) {
  p.collided = false;
  var points = [];

  for (var i = 0; i < lines.length; i++) {
    var l = lines[i];
    var x1=l.x1, y1=l.y1, x2=l.x2, y2=l.y2, x3=p.x, y3=p.y;
    var px = x2-x1, py = y2-y1, dAB = px*px + py*py;
    var u = ((x3 - x1) * px + (y3 - y1) * py) / dAB;
    var x4 = x1 + u * px, y4 = y1 + u * py;
    var dist = (x4 - x3) * (x4 - x3) + (y4 - y3) * (y4 - y3);
    if (dist <= RADIUS*RADIUS) {
      if (x4 < Math.min(x1, x2) || x4 > Math.max(x1, x2) || y4 < Math.min(y1, y2) || y4 > Math.max(y1, y2)) {
        var distStart = Math.pow(p.x - x1, 2) + Math.pow(p.y - y1, 2);
        var distEnd = Math.pow(p.x - x2, 2) + Math.pow(p.y - y2, 2);
        if (distStart <= RADIUS*RADIUS) {
          p.collided = true;
          points.push({x: x1, y: y1});
        }
        else if (distEnd <= RADIUS*RADIUS) {
          p.collided = true;
          points.push({x: x2, y: y2});
        }
      }
      else {
        p.collided = true;
        points.push({x: x4, y: y4});
      }
    }
  }
  return points;
}

function calcPhysics(p) {
  var points = detectCollisions(p);

  p.ax = 0;
  p.ay = GRAVITY;

  for (var i = 0; i < points.length; i++) {
    var nx = (p.x - points[i].x);
    var ny = (p.y - points[i].y);
    var dist = Math.sqrt(Math.pow(nx, 2) + Math.pow(ny, 2));
    nx /= dist;
    ny /= dist;

    p.x = points[i].x + (RADIUS) * nx;
    p.y = points[i].y + (RADIUS) * ny;

    p.ax += GRAVITY*nx;
    p.ay -= GRAVITY*ny;
  }
  p.vx += p.ax;
  p.vy += p.ay;
  p.x += p.vx;
  p.y += p.vy;
  
  // Bound ball to borders
  if (p.x <= RADIUS) {
    p.x = RADIUS;
  }
  if (p.x >= (MAP_WIDTH - RADIUS)) {
    p.x = MAP_WIDTH - RADIUS;
  }
  if (p.y <= RADIUS) {
    p.y = RADIUS;
  }
}

function animLoop() {
  for (var id in user_pos) {
    calcPhysics(user_pos[id]);
  }

  io.emit('pos', user_pos);
}

// Class declarations
function Line(x1, y1, x2, y2) {
  this.x1 = x1;
  this.y1 = y1;
  this.x2 = x2;
  this.y2 = y2;
}

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Constants
var MAP_WIDTH = 1920;
var MAP_HEIGHT = 1080;
var SEG_LEN = 100;
var PERIOD = 40;

// Game state
var num_users;
var snakePoints = {};

app.set('port', (process.env.PORT || 5000));

app.use(express.static('public'));

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    console.log('User connected');

	num_users++;

    var id = socket.id;
	console.log('User id: ' + id);
    
    snakePoints[id] = [];
    for (var i = 0; i < 10; i++) {
        snakePoints[id].push({x:0, y:i*SEG_LEN});
    }
	
	socket.emit('init', {id: id, snakePoints: snakePoints});

	socket.on('mousePos', function(msg) {
        var nodes = snakePoints[socket.id];
        nodes[0] = msg;
        // Move each point SEG_LEN px away from preceding point in direction of unit vector
        for (var i = 1; i < nodes.length; i++) {
            var diffX = nodes[i-1].x - nodes[i].x;
            var diffY = nodes[i-1].y - nodes[i].y;
            var euclid = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
            nodes[i].x = nodes[i-1].x - (diffX / euclid) * SEG_LEN;
            nodes[i].y = nodes[i-1].y - (diffY / euclid) * SEG_LEN;
        }
	});

	socket.on('disconnect', function() {
		console.log('User disconnected');
		delete snakePoints[socket.id];
		num_users--;
	});

});

http.listen(app.get('port'), function() {
  console.log('Running on port', app.get('port'));
});

// Start running simulation!
setInterval(animLoop, PERIOD);

function animLoop() {
  io.emit('pos', snakePoints);
}

// Class declarations
function Line(x1, y1, x2, y2) {
  this.x1 = x1;
  this.y1 = y1;
  this.x2 = x2;
  this.y2 = y2;
}

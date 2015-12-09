var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Constants
var MAP_WIDTH = 6000;
var MAP_HEIGHT = 6000;
var SEG_LEN = 100;
var PERIOD = 40;
var FOOD_FREQ = 5000; // Every 5 seconds on avg
var FOOD_RADIUS = 10; // px
var SQ_FOOD_RADIUS = Math.pow(FOOD_RADIUS, 2);

// Game state
var num_users;
var snakePoints = {};
var foodPoints = [];

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
    for (var i = 0; i < 5; i++) {
        snakePoints[id].push({x:0, y:i*SEG_LEN});
    }
	
	socket.emit('init', {id: id, snakePoints: snakePoints});

	socket.on('mousePos', function(msg) {
        var nodes = snakePoints[socket.id];
        nodes[0] = msg;
        
        if (checkEaten(msg)) {
            var lastNode = nodes[nodes.length - 1];
            nodes.push({x: lastNode.x, y: lastNode.y});
            socket.emit('grow');
            io.emit('food', foodPoints);
        }
        
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
    // Produce food item with avg frequency FOOD_FREQ
    if (Math.random() < (PERIOD / FOOD_FREQ)) {
        foodPoints.push({x: Math.random()*MAP_WIDTH - MAP_WIDTH/2, y: Math.random()*MAP_HEIGHT - MAP_HEIGHT/2});
        io.emit('food', foodPoints);
    }
    io.emit('pos', snakePoints);
}

function checkEaten(headPoint) {
    // Iterate through all food items and see if the current snake head intersects any
    // TODO: spatially map food for greater efficiency
    for (var i = 0; i < foodPoints.length; i++) {
        var f = foodPoints[i];
        var sqDist = Math.pow(f.x - headPoint.x, 2) + Math.pow(f.y - headPoint.y, 2);
        if (sqDist <= SQ_FOOD_RADIUS) {
            // Delete food item
            foodPoints.splice(i, 1);
            return true;
        }
    }
    return false;
}


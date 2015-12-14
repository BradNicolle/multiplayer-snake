var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var SpatialHash = function(width, height, x_div, y_div) {
    this.width = width;
    this.height = height;
    
    // Number of divisions
    this.x_div = x_div;
    this.y_div = y_div;
    
    // Size of divisions
    this.x_dim = width/x_div;
    this.y_dim = height/y_div;
    
    this.grid = [];
}

function clamp(num, min, max) {
    return num < min ? min : num > max ? max : num;
}

SpatialHash.prototype._key = function(point) {
    point.x = clamp(point.x, 0, this.width);
    point.y = clamp(point.y, 0, this.height);
    return (Math.floor(point.x/this.x_dim) + Math.floor(point.y/this.y_dim) * this.x_div);
}

SpatialHash.prototype.insert = function(point) {
    var obkey = this._key(point);
    var grid = this.grid;
    
    if (!grid[obkey]) {
        grid[obkey] = [];
    }
    
    grid[obkey].push(point);
}

SpatialHash.prototype.delete = function(point) {
    var cell = this.getGrid(point);
    
    if (cell) {
        for (var i = 0; i < cell.length; i++) {
            if (point.x == cell[i].x && point.y == cell[i].y) {
                //console.log("Deleted " + point.x + " " + point.y);
                cell.splice(i, 1);
                i--;
            }
        }
    }
}

SpatialHash.prototype.getGrid = function(point) {
    return this.grid[this._key(point)];
}

// Radius is Manhatten radius
SpatialHash.prototype.getSurroundingGrids = function(point, radius) {
    var grids = [];
    var topLeft = this._key({x: point.x - radius, y: point.y - radius});
    var bottomRight = this._key({x: point.x + radius, y: point.y + radius});
    
    for (var i = topLeft; i <= bottomRight; i++) {
        var box = this.grid[i];
        if (box) {
            grids = grids.concat(box);
        }
    }
    
    return grids;
}

SpatialHash.prototype.pointExists = function(point) {
    var cell = this.getGrid(point);
    if (cell) {
        for (var i = 0; i < cell.length; i++) {
            if (point.x == cell[i].x && point.y == cell[i].y) {
                return true;
            }
        }
    }
    return false;
}

// Constants
var MAP_WIDTH = 6000;
var MAP_HEIGHT = 6000;
var NUM_BUCKETS = 100; // in each dimension
var SEG_LEN = 100;
var PERIOD = 100;
var FOOD_FREQ = 50; // Every 5 seconds on avg
var FOOD_RADIUS = 10; // px
var SQ_FOOD_RADIUS = Math.pow(FOOD_RADIUS, 2);

// Game state
var num_users;
var snakePoints = {};
var sockets = {};
var gameMap = new SpatialHash(MAP_WIDTH, MAP_HEIGHT, NUM_BUCKETS, NUM_BUCKETS);

app.set('port', (process.env.PORT || 5000));

app.use(express.static('public'));

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    console.log('User connected');

	num_users++;
    sockets[socket.id] = socket;

    var id = socket.id;
	console.log('User id: ' + id);
    
    snakePoints[id] = [];
    for (var i = 0; i < 5; i++) {
        snakePoints[id].push({x:MAP_WIDTH/2, y:i*SEG_LEN+MAP_HEIGHT/2});
    }
	
	socket.emit('init', {id: id, snakePoints: snakePoints});

	socket.on('mousePos', function(msg) {
        var nodes = snakePoints[socket.id];
        nodes[0] = msg;
        
        if (checkEaten(msg)) {
            var lastNode = nodes[nodes.length - 1];
            nodes.push({x: lastNode.x+1, y: lastNode.y+1});
            socket.emit('grow');
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
        delete sockets[socket.id];
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
        gameMap.insert({x: Math.random()*MAP_WIDTH, y: Math.random()*MAP_HEIGHT});
    }
    
    for (var user in sockets) {
        var boxes = gameMap.getSurroundingGrids((snakePoints[user])[0], 1000);
        sockets[user].emit('food', boxes);
    }
    
    io.emit('pos', snakePoints);
}

function checkEaten(headPoint) {
    // Iterate through all food items in bounding box for head and see if the current snake head intersects any
    var box = gameMap.getGrid(headPoint);
    
    if (box) {
        for (var i = 0; i < box.length; i++) {
            var f = box[i];
            var sqDist = Math.pow(f.x - headPoint.x, 2) + Math.pow(f.y - headPoint.y, 2);
            if (sqDist <= SQ_FOOD_RADIUS) {
                // Delete food item
                box.splice(i, 1);
                return true;
            }
        }
    }
    return false;
}


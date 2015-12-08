var socket = io();

var canvas;
var stat;
var ctx;
var id = "";


var SEG_LEN = 100; // px
var FOOD_RADIUS = 10; // px
var snakePoints = {}; // Other snakes
var nodes = []; // My snake
var food = [];
initSnake(5);

stat = document.getElementById("status");
canvas = document.getElementById("theCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var w = canvas.width;
var h = canvas.height;

ctx = canvas.getContext("2d");

socket.on('init', function(msg) {
	console.log("ID RECEIVED: " + msg.id);
	id = msg.id;
	snakePoints = msg.snakePoints;
});

socket.on('pos', function(msg) {
	snakePoints = msg;
});

socket.on('food', function(msg) {
    food = msg;
});

socket.on('grow', function(msg) {
    var lastNode = nodes[nodes.length - 1];
    nodes.push(new Point(lastNode.x, lastNode.y));
});


addEventListener("mousemove", mouseHandler);
addEventListener("touchmove", touchHandler);

animLoop();


function initSnake(len) {
    // Generate vertical snake of length 'len'
    for (var i = 0; i < len; i++) {
        nodes.push(new Point(0, i*SEG_LEN));
    }
}

function mouseHandler(event) {
    moveHandler(event.pageX, event.pageY);
}

function touchHandler(event) {
    moveHandler(event.touches[0].pageX, event.touches[0].pageY);
    event.preventDefault();
}

function moveHandler(x, y) {
    // Offset for translated canvas origin
    nodes[0].x = x - w/2;
    nodes[0].y = y - h/2;
    
    // Move each point SEG_LEN px away from preceding point in direction of unit vector
    for (var i = 1; i < nodes.length; i++) {
        var diffX = nodes[i-1].x - nodes[i].x;
        var diffY = nodes[i-1].y - nodes[i].y;
        var euclid = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
        nodes[i].x = nodes[i-1].x - (diffX / euclid) * SEG_LEN;
        nodes[i].y = nodes[i-1].y - (diffY / euclid) * SEG_LEN;
    }
    
    // Send new head location to the server
    socket.emit('mousePos', nodes[0]);
}

function drawStuff() {
    w = canvas.width;
    h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    ctx.translate(w/2, h/2);
    
    // Draw all food
    for (var i = 0; i < food.length; i++) {
        ctx.beginPath();
        ctx.arc(food[i].x, food[i].y, FOOD_RADIUS, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'green';
        ctx.fill();
    }
    
    // Draw player's own snake
    drawSnake(nodes, 'purple');
    
    // Draw all other snakes
    for (var snakeID in snakePoints) {
        if (snakeID != id) {
            console.log(snakePoints[snakeID]);
            drawSnake(snakePoints[snakeID], 'red');
        }
    }
    
    ctx.translate(-w/2, -h/2);
}

function drawSnake(points, colour) {
    // See http://stackoverflow.com/questions/7054272/how-to-draw-smooth-curve-through-n-points-using-javascript-html5-canvas
    // for quadratic Bezier interpolation
    ctx.lineWidth = '20';
    ctx.strokeStyle = colour;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (var i = 1; i < points.length - 2; i++)
    {
        var xc = (points[i].x + points[i + 1].x) / 2;
        var yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    // curve through the last two points
    ctx.quadraticCurveTo(points[i].x, points[i].y, points[i+1].x,points[i+1].y);
    ctx.stroke();
    ctx.closePath();
}

function updateStatus() {
    stat.innerText = "LENGTH: " + nodes.length;
}

function animLoop() {
    requestAnimationFrame(animLoop);
    drawStuff();
    updateStatus();
}

function Point(x, y) {
    this.x = x;
    this.y = y;
}


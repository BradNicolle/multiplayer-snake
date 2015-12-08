//var socket = io();

var canvas;
var stat;
var ctx;
var id = "";


var SEG_LEN = 100; // px
var snakePoints = []; // Other snakes
var nodes = []; // My snake
initSnake(10);

stat = document.getElementById("status");
canvas = document.getElementById("theCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var w = canvas.width;
var h = canvas.height;

ctx = canvas.getContext("2d");

/*
socket.on('init', function(msg) {
	console.log("ID RECEIVED: " + msg.id);
	id = msg.id;
	snakePoints = msg.snakePoints;
});

socket.on('pos', function(msg) {
	snakePoints = msg.snakePoints;
});
*/

addEventListener("mousemove", moveHandler, true);

animLoop();


function initSnake(len) {
    for (var i = 0; i < len; i++) {
        nodes.push(new Point(0, i*SEG_LEN));
    }
}

function moveHandler(event) {
    nodes[0].x = event.pageX - w/2;
    nodes[0].y = event.pageY - h/2;
    for (var i = 1; i < nodes.length; i++) {
        var diffX = nodes[i-1].x - nodes[i].x;
        var diffY = nodes[i-1].y - nodes[i].y;
        var euclid = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
        nodes[i].x = nodes[i-1].x - (diffX / euclid) * SEG_LEN;
        nodes[i].y = nodes[i-1].y - (diffY / euclid) * SEG_LEN;
    }
    //socket.emit('mousePos', {x: nodes[0].x, y: nodes[0].y});
}

function drawStuff() {
    w = canvas.width;
    h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    ctx.translate(w/2, h/2);
    
    drawSnake(nodes, 'purple');
    for (var i = 0; i < snakePoints.length; i++) {
        drawSnake(snakePoints[i], 'blue');
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


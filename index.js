var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var colours = ['blue', 'red', 'green', 'yellow', 'orange', 'purple', 'black'];

var num_users = 0;
var user_counter = 0;
var data = [];

app.set('port', (process.env.PORT || 5000));

app.use(express.static('public'));

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
	console.log('a user connected');

	var userColour = colours[user_counter % colours.length];
	console.log('User given: ' + userColour);

	socket.emit('init', data);

	num_users++;
	user_counter++;
	updateUsers();

	socket.on('move', function(msg) {
		console.log(msg);
		var jsonData = {id: socket.id, x: msg.x, y: msg.y, released: false};
		data.push(jsonData);
		socket.broadcast.emit('move', jsonData);
	});

	socket.on('release', function(msg) {
		console.log(socket.id + " released");
		var jsonData = {id: socket.id, released: true};
		data.push(jsonData);
		socket.broadcast.emit('release', jsonData);
	});

	socket.on('clear', function(msg) {
		data.length = 0;
		socket.broadcast.emit('clear');
	})

	socket.on('disconnect', function() {
		console.log('a user disconnected');
		num_users--;
		updateUsers();
	});

});


http.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

function updateUsers() {
	io.emit('users', num_users);
}

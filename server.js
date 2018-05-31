// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
app.set('port', process.env.PORT);
app.use('/client', express.static(__dirname + '/client'));
app.use('/client', express.static(__dirname + '/node_modules'));
// Routing
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});
// Starts the server.
server.listen(process.env.PORT, function() {
    console.log('Starting server on port 2000');
});

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

var connectedCount = 0;
var clients = {}


var players = {};
io.on('connection', function(socket) {
    socket.on('new player', function() {
        players[socket.id] = {
            x: 500,
            y: 500,
            velY: 0,
            velX: 0,
            speed: 200,
            friction: 0.9999,
            keys: [],
            width: 10,
            height: 10,
            id: getRandomInt(9999),
            color: '#'+(Math.random()*0xFFFFFF<<0).toString(16)
        };
    });
    
    socket.on('movement', function(data) {
        var player = players[socket.id] || {};

        if (data.up) {
            if (player.velY > -200) {
                player.velY--;
            }
        }
        if (data.down) {
            if (player.velY < 200) {
                player.velY++;           
            }
        }
        if (data.right) {
            if (player.velX < 200) {
                player.velX++;
            }
        }
        if (data.left) {
            if (player.velX > -player.speed) {
                player.velX--;
            }
        }

        if (data.stop) {
            player.velX = player.velY = 0;
        }
        
        if (data.check) {
            var w = data.width
            var h = data.height
            if (player.x >= w - 15) {
                player.x = w - 20;
                player.velX = -player.velX
            } else if (player.x <= 20) {
                player.x = 20;
                player.velX = -player.velX
            }
            if (player.y > h - 15) {
                player.y = h - 20;
                player.velY = -player.velY
            } else if (player.y <= 20) {
                player.y = 20;
                player.velY = -player.velY
            }
            
        }
        player.velY *= player.friction;
        player.y += player.velY;

        player.velX *= player.friction;
        player.x += player.velX;
    });
});
setInterval(function() {
    io.sockets.emit('state', players);
}, 1000 / 60);

setInterval(function() {
    console.log(players)
}, 1000);

io.on('connection', function(socket) {
    console.log('client connected')
    connectedCount++;
    clients[socket.id] = socket;
    socket.on('disconnect', function() {
        console.log('client disconnected')
        connectedCount--;
        delete players[socket.id]
    })
})

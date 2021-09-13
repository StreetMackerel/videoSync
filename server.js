

// import express and initilize server
var express = require('express') 
// const https = require('https');

var app = express()
var http = require('http')
var server = http.createServer(app)
var io = require('socket.io')(server, {pingInterval: 5000})
var PORT = process.env.PORT || 3000

var _started = false;
var _vidPos = "0.0";

var clients = io.sockets.clients();

app.use(express.static(__dirname + '/public'))
app.use(express.json());

//Mount route
app.get(['/'], function(req, res, next) {
    res.sendFile(__dirname + '/public/index.html')
})

//when a client connects
io.on('connection', function(client) {

    console.info(`Client connected [id=${client.id}]`);

    var clientsLength = Object.keys(io.sockets.sockets).length;
    client.emit('clientList', clientsLength);

    // assigns master to first connected
    // if(Object.keys(io.sockets.sockets)[0]==client.id){
    //     client.emit('setMaster', null);
    // }

    client.on("disconnect", () => {
        console.info(`Client gone [id=${client.id}]`);
    });

    if(_started){
        client.emit('startVid', _vidPos);
    }

    client.on('getTime', function(nothing) {
        console.log('requesting time');
        io.emit('getMasterTime');
    });

    client.on('setTime', function(time) {
        console.log("master setting time")
        client.broadcast.emit('startVid',time); //this adjusts all clients video to master's time
    });
})


app.post('/start', function(request, response){
    io.emit('startVid', "0.0");
});


//start web server
server.listen(PORT, function() {
    console.log('Server starting on port :'+PORT)
})

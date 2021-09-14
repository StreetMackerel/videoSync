

// import express and initilize server
var express = require('express') 
// const https = require('https');

var app = express()
var http = require('http')
var server = http.createServer(app)
var io = require('socket.io')(server, {pingInterval: 5000}) // pinginterval handles reporting latency per client
var PORT = process.env.PORT || 3000

var _started = false;
var _vidPos = "0.0";

var clients = io.sockets.clients();

//vars for master client and current sync requestee
var requestee;
var master = null;

app.use(express.static(__dirname + '/public'));
app.use(express.json());

//Mount route
app.get(['/', '/index.html'], function(req, res, next) {
    res.sendFile(__dirname + '/public/index.html')
})

//when a client connects
io.on('connection', function(client) {

    //on connect or disconnect first update master list of clients 

    console.info(`Client connected [id=${client.id}]`);

    client.on("disconnect", () => {
        console.info(`Client gone [id=${client.id}]`);
        if(master!=null){
            var clientsLength = Object.keys(io.sockets.sockets).length;
            master.emit('clientList', clientsLength)
        };
    });

    if(master!=null){
        var clientsLength = Object.keys(io.sockets.sockets).length;
        master.emit('clientList', clientsLength);
    }
    
    //first half of sync: client gets master time. client is stored as requestee
    client.on('getTime', function(nothing) {
        console.log('requesting time');
        requestee = client;
        if(master!==null){
            master.emit('getMasterTime');
        } else {
            io.emit('getMasterTime'); // if master unassigned check all for master
        }
    });


    client.on('resync', function(time) {
        console.log("master setting time");
        io.emit('startVid',time); //this adjusts just the requestee's video to master's time
    });

    client.on('setTime', function(time) {
        console.log("master setting time");
        master = client;
        requestee.emit('startVid',time); //this adjusts just the requestee's video to master's time
    });

    
})

app.post('/start', function(request, response){
    io.emit('startVid', "0.0");
});

//start web server
server.listen(PORT, function() {
    console.log('Server starting on port :'+PORT)
})

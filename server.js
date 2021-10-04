

// import express and initilize server
var express = require('express') 
var compression = require('compression')
//const rateLimit = require("express-rate-limit");
var app = express()
app.use(compression())



var https = require('https')
var fs = require('fs');

//SSL cert for HTTPS
const privateKey = fs.readFileSync('/etc/letsencrypt/live/rising.link/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/rising.link/fullchain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
};

const t = "rising";
const at = '1920x1080!?';
const url = 'https://rising.link/show.html';
const aurl = 'https://rising.link/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.html';
const token ='auth';

var server = https.createServer(credentials, app);
    
var io = require('socket.io')(server, {pingInterval: 5000}) // pinginterval handles reporting latency per client
var PORT = process.env.PORT || 443

//vars for master client and current sync requestee
var requestee;
var master = null;
var masterSet = false;
var started =false;
let broadcaster;

app.use(express.static(__dirname + '/public'));
app.use(express.json());

//Mount route
app.get(['/', '/index.html'], function(req, res, next) {
    res.sendFile(__dirname + '/public/index.html')
})

app.get(['/admin'], function(req, res, next) {
    res.sendFile(__dirname + '/public/admin.html')
})

//when a client connects
io.on('connection', function(client) {

    client.emit('setVals', {started:started, token:token});

    //WebRTC sockets
    client.on("broadcaster", () => {
        broadcaster = client.id;
        client.broadcast.emit("broadcaster");
      });
      client.on("watcher", () => {
        client.to(broadcaster).emit("watcher", client.id);
      });
      client.on("offer", (id, message) => {
        client.to(id).emit("offer", client.id, message);
      });
      client.on("answer", (id, message) => {
        client.to(id).emit("answer", client.id, message);
      });
      client.on("candidate", (id, message) => {
        client.to(id).emit("candidate", client.id, message);
      });
      client.on("disconnect", () => {
        client.to(broadcaster).emit("disconnectPeer", client.id);
      });
    //on connect or disconnect first update master list of clients 

    console.info(`Client connected [id=${client.id}]`);

    client.on("disconnect", () => {
        console.info(`Client gone [id=${client.id}]`);
        if(masterSet){
            var clientsLength = Object.keys(io.sockets.sockets).length;

            master.emit('clientList', clientsLength-1)
        };
        if(client == master) {
            console.log('master disconnected')
            masterSet = false;
        }
    });

    if(masterSet){
        var clientsLength = Object.keys(io.sockets.sockets).length;
        master.emit('clientList', clientsLength-1);
    }
    
    //first half of sync: client gets master time. client is stored as requestee
    client.on('getTime', function() {
        console.log('requesting time');
        requestee = client;
        if(masterSet){
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
        masterSet = true;
        requestee.emit('setCountdown',time);//set time text
        requestee.emit('startVid',time); //this adjusts just the requestee's video to master's time
    });
    
    client.on('verify', function(p) { 
        console.log(p,t,at);
        if(p==t){
            client.emit('redirect',{url:url, token:token});
        } else if(p==at) {
            client.emit('redirect',{url:aurl, token:token});
        } else {
            client.emit('redirect','invalid password');
        }
    });
})

app.post('/start', function(request, response){
    started=true;
    io.emit('startShow');
});

app.post('/shake', function(request, response){
    io.emit('shake');
});

app.post('/flash', function(request, response){
    io.emit('flash');
});


app.post('/stop', function(request, response){
    started=false;
});

//start web server
server.listen(PORT, function() {
    console.log('Server starting on port :'+PORT)
})

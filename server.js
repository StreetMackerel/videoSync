

// import express and initilize server
var express = require('express') 
var compression = require('compression')
var bodyParser = require('body-parser');
//const rateLimit = require("express-rate-limit");
var app = express()
app.use(compression())
app.use(bodyParser.json()); // for parsing application/json

var http = require('http')
var https = require('https')
var fs = require('fs');

//SSL cert for HTTPS
// const privateKey = fs.readFileSync('/etc/letsencrypt/live/rising.link/privkey.pem', 'utf8');
// const certificate = fs.readFileSync('/etc/letsencrypt/live/rising.link/fullchain.pem', 'utf8');

// const credentials = {
// 	key: privateKey,
// 	cert: certificate,
// };
// var server = https.createServer(credentials, app);
var server = http.createServer(app);
// http.createServer(function (req, res) {
//     res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
//     res.end();
// }).listen(80);

       
var io = require('socket.io')(server, {pingInterval: 5000}) // pinginterval handles reporting latency per client
var PORT = process.env.PORT || 3000 //443

var broadcaster;
var currentImage = 1;

app.use(express.static(__dirname + '/public'));
app.use(express.json());

//Mount route
app.get(['/', '/index.html'], function(req, res, next) {
    res.sendFile(__dirname + '/public/index.html')
})

//when a client connects
io.on('connection', function(client) {

    client.emit('setVals', {currentImage:currentImage, broadcaster:broadcaster});

    //send admin user count
    updateClientList(client);

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
        updateClientList(client);
    });

    client.on("newImage", function(index){
        currentImage=index;
        io.emit('newImage', index);
    });
})

app.post('/setNewImage', function(request, response){
  response.send(request.body.value);
  console.log(request.body.value)
  io.emit('setNewImage', request.body.value);
});

function updateClientList(client){
    var clientsLength = Object.keys(io.sockets.sockets).length;
    client.to(broadcaster).emit('clientList', clientsLength-1);
}

//start web server
server.listen(PORT, function() {
    console.log('Server starting on port :'+PORT)
})




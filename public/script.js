var socket = io.connect();
var testText = "default";
var buttonState;
var isMaster = false;
var currTime = "0.0"

window.focus();

//standard socket functions for connections
socket.on('connect', function() {
    console.log("socket connected")
})

socket.on('clientList', function(data) {
    document.getElementById('clientCount').innerHTML = `${data} Clients Connected`
})

socket.on('setMaster', function() {
    setMaster();
})

socket.on('startVid', function(pos) {
    startVid(pos);
})

socket.on('getMasterTime', function(pos) {
    if(isMaster){
        var vid = document.getElementById("vid");
        var time = vid.currentTime;
        socket.emit('setTime', time);
    }
})

function setMaster(){
    isMaster = true;
    document.getElementById("clientID").innerHTML= 'MASTER';
}

function getTime() {
    socket.emit('getTime', null);
}

function startVid(pos) {
    var vid = document.getElementById("vid");
    console.log("starting video at: "+pos);
    vid.currentTime = pos;
    vid.play();
   // vid.muted=false
}

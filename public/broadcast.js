var testText = "default";
var buttonState;
var isMaster = false;
var unmuted = false;
var currTime = "0.0"
var latency = 0;
var mobileBuffer = 0;
var isMobile = false; //initiate as false
var isiOS = false;

document.addEventListener("DOMContentLoaded", function() {
  setMaster();
});

const peerConnections = {};
const config = {
  iceServers: [
    { 
      "urls": "stun:stun.l.google.com:19302",
    },
    // { 
    //   "urls": "turn:TURN_IP?transport=tcp",
    //   "username": "TURN_USERNAME",
    //   "credential": "TURN_CREDENTIALS"
    // }
  ]
};

const socket = io.connect(window.location.origin);

socket.on("answer", (id, description) => {
  peerConnections[id].setRemoteDescription(description);
});

socket.on("watcher", id => {
  const peerConnection = new RTCPeerConnection(config);

  peerConnections[id] = peerConnection;

  //let stream = videoElement.srcObject;
  let stream = audioElement.srcObject;
 // stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
  stream.getAudioTracks().forEach(track => peerConnection.addTrack(track, stream));
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };
 
  run();
  async function run() {
  const offer = await peerConnection.createOffer();
  offer.sdp = offer.sdp.replace('useinbandfec=1', 'useinbandfec=1; stereo=1; sprop-stereo=1')
  await peerConnection.setLocalDescription(offer)

    .then(() => socket.emit("offer", id, peerConnection.localDescription));
    console.log(peerConnection.localDescription);
  }
});

socket.on("candidate", (id, candidate) => {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", id => {
  peerConnections[id].close();
  delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
};

// Get camera and microphone
//const videoElement = document.querySelector("video");
const audioElement = document.querySelector("audio");
const audioSelect = document.querySelector("select#audioSource");
//const videoSelect = document.querySelector("select#videoSource");

audioSelect.onchange = getStream;
//videoSelect.onchange = getStream;

getStream()
  .then(getDevices)
  .then(gotDevices);

function getDevices() {
  return navigator.mediaDevices.enumerateDevices();
}

function gotDevices(deviceInfos) {
  window.deviceInfos = deviceInfos;
  for (const deviceInfo of deviceInfos) {
    const option = document.createElement("option");
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === "audioinput") {
      option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
      audioSelect.appendChild(option);
     }
     // else if (deviceInfo.kind === "videoinput") {
    //   option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
    //   videoSelect.appendChild(option);
    // }
  }
}

function getStream() {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const audioSource = audioSelect.value;
  //const videoSource = videoSelect.value;
  const constraints = {
    
    audio: { deviceId: audioSource ? { exact: audioSource } : undefined,
      channelCount:2, //enable stereo constraint
      echoCancellation: false, // disabling audio processing
      googAutoGainControl: false,
      googNoiseSuppression: false,
      googHighpassFilter: false,
      sampleSize: 16
    },
    video: false
  };
  return navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .catch(handleError);
}

function gotStream(stream) {
  window.stream = stream;
  audioSelect.selectedIndex = [...audioSelect.options].findIndex(
    option => option.text === stream.getAudioTracks()[0].label
  );
  // videoSelect.selectedIndex = [...videoSelect.options].findIndex(
  //   option => option.text === stream.getVideoTracks()[0].label
  // );
  // videoElement.srcObject = stream;
  audioElement.srcObject = stream;
  socket.emit("broadcaster");
}

//end webRTC code

socket.on('connect', function() {
  console.log("socket connected")
})

socket.on('clientList', function(data) {
  document.getElementById('clientCount').innerHTML = `${data} Clients Connected`
})

socket.on('setMaster', function() {
  setMaster();
})

//starts video at master postion + 'latency' + 'extra for mobile execution time'
socket.on('startVid', function(pos) {
  startVid(parseFloat(pos)+((latency+mobileBuffer)/1000)); 
})

//calculates latency, fired every 5 seconds
socket.on('pong', function(ms) {
  latency = ms;
  console.log(latency);
});

socket.on('getMasterTime', function(recipient) {
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
  socket.emit('getTime');
}

function syncAudio(){
  var vid = document.getElementById("vid");
  var aud = document.getElementById("aud");
  aud[0].currentTime = vid.currentTime;
}

function toggleMute() {
  console.log('unmuting')
  unmuted = true;
  var vid = document.getElementById("vid");
  var aud = document.getElementById("aud");
  aud.currentTime = vid.currentTime;
  aud.play();
  document.getElementById("unmute").hidden = true;
  document.getElementById("time").hidden = true;
  //document.getElementById("resync").hidden = false;
}

function skip(){
  aud.currentTime = vid.currentTime;
  aud.play();
}

function syncAll(){
  //aud.load();
  if(isMaster){
      var vid = document.getElementById("vid");
      var time = vid.currentTime;
      socket.emit('resync', time);
      console.log('starting sync all');
  }
}

function startVid(pos) {

  if(!isMaster){
      if(isiOS){
          var vid = document.getElementById("vid");
          var aud = document.getElementById("aud");
          console.log("starting video at: "+pos);
          vid.currentTime = pos;
          vid.play();
          document.getElementById("sync").hidden = true 
          if(!unmuted){
              document.getElementById("unmute").hidden = false;
          } else {
              document.getElementById("resync").hidden = false;
              aud.currentTime = vid.currentTime;
              aud.play();
          }
          // aud.load();
          // aud.play();

      } else {
          var vid = document.getElementById("vid");
          var aud = document.getElementById("aud");
          console.log("starting video at: "+pos);
          vid.currentTime = pos;
          aud.currentTime = pos;
          vid.play();
          aud.play();
          document.getElementById("sync").hidden = true;
          document.getElementById("resync").hidden = false;
      } 
  } else {
      var vid = document.getElementById("vid");
      console.log("starting video at: "+pos);
      vid.currentTime = pos;
      vid.play();
  }
} 


function handleError(error) {
  console.error("Error: ", error);
}
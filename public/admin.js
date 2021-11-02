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

socket.on("setVals", function(data) {
  //setvals
})

//core webRTC sockets
socket.on("answer", (id, description) => {
  peerConnections[id].setRemoteDescription(description);
});

socket.on("watcher", id => {
  const peerConnection = new RTCPeerConnection(config);

  peerConnections[id] = peerConnection;

  let stream = audioElement.srcObject;
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

const audioElement = document.querySelector("audio");
const audioSelect = document.querySelector("select#audioSource");

audioSelect.onchange = getStream;

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
  }
}

function getStream() {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const audioSource = audioSelect.value;
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
  audioElement.srcObject = stream;
  socket.emit("broadcaster");
}
//end webRTC code

socket.on('connect', function() {
  console.log("admin connected");
})

socket.on('clientList', function(data) {
  document.getElementById('clientCount').innerHTML = `${data} Clients Connected`
})

//calculates latency, fired every 5 seconds
socket.on('pong', function(ms) {
  latency = ms;
  console.log(latency);
});

function setNewImage(index){
    socket.emit('newImage', index);
    document.getElementById('currIndex').innerHTML = 'Current Image: '+index;
}

function handleError(error) {
  console.error("Error: ", error);
}
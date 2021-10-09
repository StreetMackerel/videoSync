var socket = io.connect();
var testText = "default";
var buttonState;
var isMaster = false;
var unmuted = false;
var currTime = "0.0"
var latency = 0;
var mobileBuffer = 0;
var isMobile = false; //initiate as false
var isiOS = false;
var token;
var started = false;
var timerStarted = false;

//WebRTC code 
let peerConnection;
const config = {
  iceServers: [
      { 
        "urls": "stun:stun.l.google.com:19302",
      },
  ]
};

const audio = document.querySelector("audio");

socket.on("offer", (id, description) => {
  peerConnection = new RTCPeerConnection(config);
  peerConnection
    .setRemoteDescription(description)
    run();
  async function run() {
    const answer = await peerConnection.createAnswer();

    // this is a process called sdp munging. Changing the negotiated terms of the stream due to a bug in all browsers except firefox
    answer.sdp = answer.sdp.replace('useinbandfec=1', 'useinbandfec=1; stereo=1; sprop-stereo=1')
    await peerConnection.setLocalDescription(answer)
    .then(() => {
      socket.emit("answer", id, peerConnection.localDescription);
    });
    console.log(peerConnection.localDescription);
  }
  peerConnection.ontrack = event => {
    //video.srcObject = event.streams[0];
    audio.srcObject = event.streams[0];
  };
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };
});

socket.on("candidate", (id, candidate) => {
  peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));
});

socket.on("connect", () => {
  socket.emit("watcher");
  console.log("socket connected");
  getTime();
});


socket.on("startShow", function() {
  startShow();
  audio.muted=false;
})

socket.on("stream", function() {
  const audio = document.querySelector("audio");
  audio.muted = false;
})

socket.on("credits", function() {
  var string = '/img/credits.jpg';
  document.getElementById("copy3").style.backgroundImage = "url('" + string + "')";
  link();
})


function startShow(){
  document.getElementById('vid').remove();
  document.getElementById('test').remove();
  document.getElementById('copy3').style.zIndex = 500;
  const audio = document.querySelector("audio");
  audio.muted=false;
  //document.getElementById('vid2').play();
}

socket.on("setVals", function(data) {
  token=data.token;
  started=data.started;
  // if(token!=localStorage.token){
  //   window.location.href = 'https://rising.link';
  // }
})

socket.on("broadcaster", () => {
  socket.emit("watcher");
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
  peerConnection.close();
};
// end WebRTC code

// device detection
if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) { 
    isMobile = true;
   // screen.orientation.lock("portrait");
    mobileBuffer += 0; //average time for mobile device to perform timeskip on html video

    var userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        isiOS = true;

        
    }
}


window.focus();

//standard socket functions for connections

//starts video at master postion + 'latency' + 'extra for mobile execution time'
socket.on('startVid', function(pos) {
    startVid(parseFloat(pos)+((latency+mobileBuffer)/1000)); 
});

// socket.on('startVid2', function(pos) {
//     startVid2(parseFloat(pos)+((latency+mobileBuffer)/1000)); 
// });

socket.on('shake', function() {
  navigator.vibrate([100,50,100,50,100,50,100]);
});

socket.on('link', function() {
  link();
});

function link(){
  document.getElementById('link').hidden=false;
}
socket.on('flash', function() {
  //flash here
});

//calculates latency, fired every 5 seconds
socket.on('pong', function(ms) {
    latency = ms;
    //console.log(latency);
});

function startTimer(duration) {
  let vidDuration = 1800;
  duration = vidDuration-duration;
  var timer = duration, minutes, seconds, milliseconds;

  
  var repeat = setInterval(function () {
      minutes = parseInt(timer / 60, 10);
      seconds = parseInt(timer % 60, 10);
      milliseconds = Math.floor(Math.random() * 90 + 10);

      if (minutes<0) {minutes =0};
      if (seconds<0) {seconds =0};
      if (minutes==0 && seconds==0) {milliseconds=0};

      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;

      if (document.getElementById("time") == null){
        clearInterval(repeat);
      }

      
      display = document.getElementById("time").innerHTML = minutes + ":" + seconds + ':' + milliseconds;
      timer-=0.01

  }, 10);
}

function next(){
  document.getElementById("copy").classList.add('fade');
    setTimeout(() => {
      document.getElementById('copy').remove();
    }, 2000);
    document.getElementById("time").style.zIndex = 10;

    document.getElementById("sync").hidden = true;
}

function getTime() {
    socket.emit('getTime');
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
function unmute(){
    console.log("Enabling audio")

    audio.muted = false;

    //webRTC audio start
    audio.play();
    document.getElementById("unmute").hidden = true;
    
    reveal();

    var aud = document.getElementById('test');
   //local audio start
   // aud.load();
    tryPlay();
};

function reveal(){

  if(started){
    startShow();
    audio.muted = false;
  }
  document.getElementById("time").hidden = true;
  document.getElementById("copy2").classList.add('fade');
  setTimeout(() => {
  document.getElementById('copy2').remove();
  document.getElementById('time').remove();
}, 2000);
}


function startVid(pos) {

   //wait for fade anim then delete element
    
    if(!isMaster){

            var vid = document.getElementById("vid");
            console.log("starting video at: "+pos);
            vid.currentTime = pos;
            vid.play();

            if(!timerStarted){
              startTimer(pos);
              timerStarted = true;
            }
            
            console.log('starting countdown at: '+pos);
             // document.getElementById("unmute").hidden = true;
            
            

    } else {
        
      var vid = document.getElementById("vid");
      console.log("starting video at: "+pos);
      vid.currentTime = pos;
      vid.play();
        
    }
    
} 

function startVid2(pos) {

   //wait for fade anim then delete element
    
    if(!isMaster){

            var vid = document.getElementById("vid2");
            console.log("starting video 2 at: "+pos);
            vid.currentTime = pos;
            vid.play();
          
          
    } else {
        
        var vid = document.getElementById("vid2");
        console.log("starting video 2 at: "+pos);
        vid.currentTime = pos;
        vid.play();
        
    }
    
} 

if(!isiOS){document.getElementById('preload').classList.add('fade');} else {document.getElementById('test').load();}
var x,y = false;
var aud = document.getElementById('test');
function myOnCanPlayThroughFunction() { console.log('Can play through'); x=true; if(isiOS){tryPlay();}}
function myOnLoadedData() { console.log('Loaded data'); y= true; if(isiOS){tryPlay();}}

function tryPlay(){
  if(x&&y){
      document.getElementById('preload').classList.add('fade');
      //aud.currentTime = document.getElementById('vid').currentTime;
      aud.play();
      getTime();
  }
}

//on return to tab
document.addEventListener("visibilitychange", function() {
  getTime();
});

setInterval(function () {
  if(!started){
    getTime();
  }
  }, 20000);

  


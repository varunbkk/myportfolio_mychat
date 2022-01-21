const APP_ID = 'YOUR APP ID'

// Retrieves the channel,token, UID and user information from the sessionStorage
const CHANNEL = sessionStorage.getItem('room');
const TOKEN = sessionStorage.getItem('token');
let UID = Number(sessionStorage.getItem('UID'));
let username = sessionStorage.getItem('username');

var config = {mode:"rtc",codec:"vp8"};
const client = AgoraRTC.createClient(config);
// User ID


// Variable that stores the local audio and video tracks
// localTracks[0] is the audio track and localTracks[1] is the video track
let localTracks = []

//
let remoteUsers = {}

// Joins the chat channel
let joinAndDisplayLocalStream = async () =>
{

  document.getElementById('room-name').innerText = CHANNEL
  // Whenever a user publishes their track / joins a stream
  client.on('user-published', handleUserJoined);
  // Whenever a user deletes their track / leaves a stream
  client.on('user-left', handleUserLeft);

  try
  {
      await client.join(APP_ID,CHANNEL,TOKEN,UID);
  }
  catch (e)
  {
    console.error(e)
    window.open('/','_self')
  }


  // Getting the user's  mic and camera tracks and inserting them into the localTracks array
  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
  let member = await createMember()
  console.log('member',member);

  // Create a video player
  let player = `
  <div class="video-container" id="user-container-${UID}">
    <div class="video-player" id="user-${UID}">
      <div class="username-wrapper"><span class="user-name">${member.name}</span></div>

    </div>
  </div>
  `
  // Injecting the user ID into the player div
  document.getElementById('video-streams').insertAdjacentHTML('beforeend',player);

  // Play the video track
  localTracks[1].play(`user-${UID}`);

  // Publish the audio and video tracks so other people can see them
  // await client.setClientRole("host");
  await client.publish([localTracks[0],localTracks[1]]);
};

let handleUserJoined = async (user, mediaType) =>
{
  // Adding the user to the list of remote users
  remoteUsers[user.uid] = user;
  await client.subscribe(user, mediaType);

  if (mediaType === 'video'){
    let player = document.getElementById(`user-container-${user.uid}`);

    // Checks if the user's audio player already exists / if they are already in the room
    // If yes, we remove it first so that can be reloaded again
    if (player != null)
    {
      player.remove();
    }

    let member = await getMember(user)

    // Re-creating the video player again
    player = `<div class="video-container" id="user-container-${user.uid}">
                <div class="video-player" id="user-${user.uid}">
                  <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
                  </div>
              </div>`

    // Injecting the user ID into the player div again
      document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);
    //
    user.videoTrack.play(`user-${user.uid}`);
  }

  if (mediaType === 'audio')
  {
    user.audioTrack.play();
  }

};

let handleUserLeft = async (user) => {
  delete remoteUsers[user.uid];
  document.getElementById(`user-container-${user.uid}`).remove();
  // deleteMember();
};

// Function to close a user's tracks, when they leave the room
let leaveAndRemoveLocalStream = async() => {

  for (i=0;i<localTracks.length;i++)
  {
    localTracks[i].stop();
    localTracks[i].close();
  }

  await client.leave();
  deleteMember();
  // Redirect user back to home page when they leave the stream
  window.open('/', '_self');
}

// Function to mute/close the camera feed - although the camera is still on
let toggleCamera = async(e) => {
  if(localTracks[1].muted)
  {
    await localTracks[1].setMuted(false);
    e.target.style.backgroundColor = 'rgb(144, 238, 144, 1)'
  }
  else
  {
    await localTracks[1].setMuted(true);
    e.target.style.backgroundColor = 'rgb(255, 80, 80, 1)'
  }
}

// Function to mute the local mic
let toggleMic = async(e) => {
  if(localTracks[0].muted)
  {
    await localTracks[0].setMuted(false);
    e.target.style.backgroundColor = 'rgb(100, 149, 237, 1)'
  }
  else
  {
    await localTracks[0].setMuted(true);
    e.target.style.backgroundColor = 'rgb(255, 80, 80, 1)'
  }
}

let createMember = async() => {
  let response = await fetch('/create_member/',{
    method:'POST',
    headers:{
      'Content-Type':'application/json'
    },
    body:JSON.stringify({'name':username,'UID':UID,'room_name':CHANNEL})

  })
  let member = await response.json()
  return member
}

let deleteMember = async() => {
  let response = await fetch('/delete_member/',{
    method:'POST',
    headers:{
      'Content-Type':'application/json'
    },
    body:JSON.stringify({'name':username,'UID':UID,'room_name':CHANNEL})
  })
  let member = await response.json()
}

let getMember = async(user) => {
  let response = await fetch(`/get_member/?UID=${user.uid}&room_name=${CHANNEL}`)
  let member = await response.json()
  return member
}

joinAndDisplayLocalStream();

window.addEventListener('beforeunload', deleteMember)
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream);
document.getElementById('video-btn').addEventListener('click', toggleCamera);
document.getElementById('mic-btn').addEventListener('click', toggleMic);

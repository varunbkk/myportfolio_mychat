const APP_ID = '44c5646be93547cb8087376f1bed0a70'
const CHANNEL = 'Main'
const TOKEN = '00644c5646be93547cb8087376f1bed0a70IABUyE7kROgmuhya6rSHdqyq2n9XC8Y3MhbjumUCPTK1RlpiGh8AAAAAEADC8VeAnPnoYQEAAQCb+ehh'

var config = {mode:"rtc",codec:"vp8"};
const client = AgoraRTC.createClient(config);
// User ID
let UID;

// Variable that stores the local audio and video tracks
// localTracks[0] is the audio track and localTracks[1] is the video track
let localTracks = []

//
let remoteUsers = {}

// Joins the chat channel
let joinAndDisplayLocalStream = async () =>
{

  // Whenever a user publishes their track / joins a stream
  client.on('user-published', handleUserJoined);
  // Whenever a user deletes their track / leaves a stream
  client.on('user-left', handleUserLeft);

  UID = await client.join(APP_ID,CHANNEL,TOKEN,null);

  // Getting the user's  mic and camera tracks and inserting them into the localTracks array
  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

  // Create a video player
  let player = `
  <div class="video-container" id="user-container-${UID}">
    <div class="video-player" id="user-${UID}">
      <div class="username-wrapper"><span class="user-name">My Name</span></div>

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

    // Re-creating the video player again
    player = `<div class="video-container" id="user-container-${user.uid}">
                <div class="video-player" id="user-${user.uid}">
                  <div class="username-wrapper"><span class="user-name">My Name</span></div>
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
};

joinAndDisplayLocalStream();

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const statusDiv = document.getElementById('status');

const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

const socket = new WebSocket('wss://video-chat-bpgv.onrender.com');

socket.onmessage = async (event) => {
  let data = event.data;

  if (data instanceof Blob) {
    data = await data.text();
  }

  try {
    const message = JSON.parse(data);

    if (message.type === 'partner-found') {
      statusDiv.textContent = 'Partner found! Starting video chat...';
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.send(JSON.stringify({ type: 'offer', offer }));
    } else if (message.type === 'offer') {
      if (peerConnection.signalingState === 'stable') { 
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.send(JSON.stringify({ type: 'answer', answer }));
      } else {
        console.warn('Peer connection not in stable state. Ignoring offer.');
      }
    } else if (message.type === 'answer') {
      if (peerConnection.signalingState === 'have-local-offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
      } else {
        console.warn('Peer connection not in correct state for setting answer.');
      }
    } else if (message.type === 'candidate') {
      // Check if remote description is set before adding ICE candidate
      if (peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
        console.log('Added ICE candidate:', message.candidate);
      } else {
        console.warn('Remote description not set. Cannot add ICE candidate.');
      }
    } else if (message.type === 'partner-disconnected') {
      statusDiv.textContent = 'Partner disconnected. Waiting for a new partner...';
      remoteVideo.srcObject = null; 
    }
  } catch (error) {
    console.error('Failed to parse message:', error);
  }
};

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localVideo.srcObject = stream;
    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
      console.log(`Added track: ${track.kind}`);
    });
  })
  .catch(error => {
    console.error('Error accessing media devices:', error);
    alert('Please allow access to camera and microphone.');
  });

peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
    console.log('Sent ICE candidate:', event.candidate);
  }
};

peerConnection.ontrack = (event) => {
  const remoteStream = event.streams[0];
  if (remoteStream) {
    remoteVideo.srcObject = remoteStream; 
    console.log('Received remote stream:', remoteStream);
  } else {
    console.error('No remote stream received');
  }
};

document.getElementById('endCall').addEventListener('click', () => {
  socket.close();
  peerConnection.close();
  remoteVideo.srcObject = null;
  statusDiv.textContent = 'Call ended. Waiting for a new partner...';
  console.log('Call ended.');
});

socket.onclose = () => {
  console.log('WebSocket connection closed');
  statusDiv.textContent = 'Disconnected from server. Reload to retry.';
};

socket.onerror = (error) => {
  console.error('WebSocket error:', error);
  statusDiv.textContent = 'Error with WebSocket connection.';
};

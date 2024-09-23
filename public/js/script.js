const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const statusDiv = document.getElementById('status');

// Initialize PeerConnection with STUN server
const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});



// WebSocket connection for signaling
const socket = new WebSocket('ws://localhost:3500');

// Handle incoming WebSocket messages
socket.onmessage = async ({ data }) => {
    console.log('Received data:', data); // Check what the `data` actually is
    try {
        const message = JSON.parse(data); // Attempt to parse only if `data` is a string
        console.log('Parsed message:', message);
        
        // Handle the different message types
        if (message.type === 'partner-found') {
            statusDiv.textContent = 'Partner found! Starting video chat...';
            
            // Create an offer
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.send(JSON.stringify({ type: 'offer', offer }));
        } else if (message.type === 'offer') {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.send(JSON.stringify({ type: 'answer', answer }));
        } else if (message.type === 'answer') {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
        } else if (message.type === 'candidate') {
            await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
        } else if (message.type === 'partner-disconnected') {
            statusDiv.textContent = 'Partner disconnected. Waiting for a new partner...';
            remoteVideo.srcObject = null;
        }
    } catch (error) {
        console.error('Failed to parse message:', error);
    }
};

// Get local media (camera and microphone)
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    // Display local video
    localVideo.srcObject = stream;

    // Add local tracks (video/audio) to peer connection
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
  })
  .catch(error => {
    console.error('Error accessing media devices:', error);
    alert('Please allow access to camera and microphone.');
  });

// ICE Candidate event: Send new ICE candidates to remote peer via WebSocket
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
    console.log('Sent ICE candidate:', event.candidate);
  }
};

// Handle remote stream from the peer and display it
peerConnection.ontrack = (event) => {
  const [remoteStream] = event.streams;
  if (remoteStream) {
    remoteVideo.srcObject = remoteStream;
    console.log('Received remote stream:', remoteStream);
  } else {
    console.error('No remote stream received');
  }
};

// End call functionality: Close WebSocket and PeerConnection
document.getElementById('endCall').addEventListener('click', () => {
  socket.close();  // Close WebSocket connection
  peerConnection.close();  // Close PeerConnection
  remoteVideo.srcObject = null;  // Clear remote video
  statusDiv.textContent = 'Call ended. Waiting for a new partner...';
  console.log('Call ended.');
});

// Handle WebSocket connection closure
socket.onclose = () => {
  console.log('WebSocket connection closed');
  statusDiv.textContent = 'Disconnected from server. Reload to retry.';
};

// Handle WebSocket errors
socket.onerror = (error) => {
  console.error('WebSocket error:', error);
  statusDiv.textContent = 'Error with WebSocket connection.';
};
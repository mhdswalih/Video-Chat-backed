const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const WebSocketController = require('./Controllers/WebSocketController'); 

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public'))); 

// Serve the homepage (EJS template rendering)
app.get('/', WebSocketController.Loadhomepage);

// Create an HTTP server and WebSocket server on top of it
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Handle WebSocket events
wss.on('connection', (ws) => {
    console.log('New client connected!');

    // Event: when the client sends a message
    ws.on('message', (message) => {
        console.log('Received message:', message);

        // Handle message (assuming it's JSON)
        try {
            const data = JSON.parse(message);

            // Example: Handle specific types of messages
            if (data.type === 'offer') {
                console.log('Offer received:', data.offer);
                // Process offer, and maybe send it to another connected client
            } else if (data.type === 'answer') {
                console.log('Answer received:', data.answer);
                // Process answer
            } else if (data.type === 'candidate') {
                console.log('ICE Candidate received:', data.candidate);
                // Handle ICE candidate
            }

            // Respond to the client
            ws.send(JSON.stringify({ message: 'Message received', type: data.type }));

        } catch (err) {
            console.error('Error parsing message:', err);
            ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
    });

    // Event: when the client disconnects
    ws.on('close', () => {
        console.log('Client disconnected');
    });

    // Event: if there's an error with the WebSocket connection
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    // Send an initial message to the client
    ws.send(JSON.stringify({ message: 'Welcome to the WebSocket server!' }));
});

// Start the server
server.listen(3500, () => {
    console.log('Server is running on http://localhost:3500');
});

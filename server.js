const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const WebSocketController = require('./Controllers/WebSocketCOntroller'); 
const UserModel = require('./models/userModel');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public'))); 

app.get('/', WebSocketController.LoaddevChat);
app.get('/video',WebSocketController.Loadhomepage);
app.get('/home',WebSocketController.loadIndexPage);


const server = app.listen(3500, () => {
    console.log('Server is running on http://localhost:3500');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    WebSocketController.handleConnection(ws);
});

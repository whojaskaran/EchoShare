const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000'; // Default to dev origin
const io = socketIo(server, {
    cors: {
        origin: '*', // Allow connections from any origin
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 3001;

// In-memory store for rooms
const rooms = {};

// Function to generate a unique, short room code
function generateRoomCode() {
    let code;
    do {
        code = Math.random().toString(36).substring(2, 7).toUpperCase();
    } while (rooms[code]); // Ensure code is unique
    return code;
}

app.get('/', (req, res) => {
    res.send('Server is running and healthy!');
});

io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Handle room creation
    socket.on('createRoom', (callback) => {
        const roomCode = generateRoomCode();
        rooms[roomCode] = {
            sockets: new Set(),
            messages: [],
            files: []
        };
        rooms[roomCode].sockets.add(socket.id);
        socket.join(roomCode);
        console.log(`Socket ${socket.id} created and joined room: ${roomCode}`);
        callback({ success: true, roomCode: roomCode });
    });

    // Handle joining an existing room
    socket.on('joinRoom', (roomCode, callback) => {
        const room = rooms[roomCode];
        if (room) {
            room.sockets.add(socket.id);
            socket.join(roomCode);
            console.log(`Socket ${socket.id} joined room: ${roomCode}`);
            // Send existing messages and files to the newly joined client
            socket.emit('pastMessages', room.messages);
            socket.emit('pastFiles', room.files);
            callback({ success: true, roomCode: roomCode });
        } else {
            callback({ success: false, message: 'Room not found' });
        }
    });

    // Handle disconnections
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        // Remove socket from any rooms it was in
        for (const roomCode in rooms) {
            const room = rooms[roomCode];
            if (room.sockets.has(socket.id)) {
                room.sockets.delete(socket.id);
                socket.leave(roomCode);
                console.log(`Socket ${socket.id} left room: ${roomCode}`);

                // If room becomes empty, delete it
                if (room.sockets.size === 0) {
                    delete rooms[roomCode];
                    console.log(`Room ${roomCode} is empty and deleted.`);
                }
                // No break here, as a socket might be associated with multiple rooms (though our current logic limits it to one for simplicity)
            }
        }
    });

    // Handle incoming messages
    socket.on('sendMessage', ({ roomCode, message }) => {
        const room = rooms[roomCode];
        if (room) {
            room.messages.push(message); // Store message in-memory
            io.to(roomCode).emit('receiveMessage', message); // Broadcast to all in the room
            console.log(`Message in room ${roomCode}: ${message.text}`);
        }
    });

    // Handle incoming files
    socket.on('sendFile', ({ roomCode, file }) => {
        const room = rooms[roomCode];
        if (room) {
            room.files.push(file); // Store file in-memory
            io.to(roomCode).emit('receiveFile', file); // Broadcast to all in the room
            console.log(`File received in room ${roomCode}: ${file.name}`);
        }
    });
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
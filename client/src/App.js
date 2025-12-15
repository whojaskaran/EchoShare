import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
const socket = io(SERVER_URL);

function App() {
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState('');
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isConnected, setIsConnected] = useState(false); // New state for connection status
  const fileInputRef = useRef();

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true); // Update connection status
    });

    socket.on('disconnect', () => { // Handle disconnect event
      console.log('Disconnected from server');
      setIsConnected(false); // Update connection status
    });

    socket.on('receiveMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('receiveFile', (file) => {
      setFiles((prevFiles) => [...prevFiles, file]);
    });

    socket.on('pastMessages', (pastMessages) => {
      setMessages(pastMessages);
    });

    socket.on('pastFiles', (pastFiles) => {
      setFiles(pastFiles);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect'); // Clean up disconnect listener
      socket.off('receiveMessage');
      socket.off('receiveFile');
      socket.off('pastMessages');
      socket.off('pastFiles');
    };
  }, []);

  const createRoom = () => {
    if (!isConnected) { // Only emit if connected
      alert('Cannot create room: Not connected to server.');
      return;
    }
    socket.emit('createRoom', (response) => {
      if (response.success) {
        setCurrentRoom(response.roomCode);
        setRoomCode(response.roomCode);
        console.log(`Created and joined room: ${response.roomCode}`);
      } else {
        alert('Failed to create room');
      }
    });
  };

  const joinRoom = () => {
    if (roomCode) {
      socket.emit('joinRoom', roomCode, (response) => {
        if (response.success) {
          setCurrentRoom(roomCode);
          console.log(`Joined room: ${roomCode}`);
        } else {
          alert(response.message);
        }
      });
    } else {
      alert('Please enter a room code');
    }
  };

  const sendMessage = () => {
    if (messageInput.trim() && currentRoom) {
      const message = {
        id: Date.now(),
        text: messageInput,
        sender: socket.id,
        timestamp: new Date().toLocaleTimeString(),
      };
      socket.emit('sendMessage', { roomCode: currentRoom, message });
      setMessageInput('');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && currentRoom) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = {
          id: Date.now(),
          name: file.name,
          type: file.type,
          data: e.target.result, // Base64 encoded file
          sender: socket.id,
          timestamp: new Date().toLocaleTimeString(),
        };
        socket.emit('sendFile', { roomCode: currentRoom, file: fileData });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="App">
      <h1>Echo Share</h1>
      {!currentRoom ? (
        <div className="room-setup">
          <input
            type="text"
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
          <button onClick={createRoom}>Create New Room</button>
        </div>
      ) : (
        <div className="chat-room">
          <h2>Room: {currentRoom}</h2>
          <div className="messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender === socket.id ? 'sent' : 'received'}`}>
                <strong>{msg.sender === socket.id ? 'You' : msg.sender}:</strong> {msg.text} <em>({msg.timestamp})</em>
              </div>
            ))}
          </div>
          <div className="files">
            <h3>Shared Files:</h3>
            {files.map((file) => (
              <div key={file.id} className="file-item">
                <a href={file.data} download={file.name}>
                  {file.name} ({file.type})
                </a> <em>({file.timestamp})</em>
              </div>
            ))}
          </div>
          <div className="message-input">
            <input
              type="text"
              placeholder="Type your message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage}>Send Message</button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <button onClick={() => fileInputRef.current.click()}>Share File</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
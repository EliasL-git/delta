const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const path = require('path');

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? true  // Allow all origins in production
      : ["http://localhost:3000", "http://localhost:3001", "http://localhost:5000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

const rooms = {};
const canvasStates = {}; // Store canvas states for each room

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('create room', () => {
    const room = Math.random().toString(36).substring(2, 12);
    rooms[room] = { users: [] };
    canvasStates[room] = null; // Initialize canvas state
    socket.join(room);
    rooms[room].users.push(socket.id);
    socket.emit('room created', room);
    
    // Send empty member list to room creator (they're the first one)
    socket.emit('room members', []);
    
    // Notify that this user joined the room they created (no one else to notify yet)
    socket.to(room).emit('user joined', { userId: socket.id, username: socket.username });
    console.log(`Room ${room} created and user ${socket.id} joined`);
  });

  socket.on('set username', (username) => {
    socket.username = username;
    console.log(`User ${socket.id} set username to ${username}`);
  });

  socket.on('join room', (room) => {
    if (rooms[room]) {
      socket.join(room);
      rooms[room].users.push(socket.id);
      socket.emit('joined room', room);
      
      // Send current member list to the new joiner
      const currentMembers = rooms[room].users.map(userId => {
        const memberSocket = io.sockets.sockets.get(userId);
        return {
          userId: userId,
          username: memberSocket?.username || userId
        };
      }).filter(member => member.userId !== socket.id); // Exclude the current user
      
      socket.emit('room members', currentMembers);
      
      // Send current canvas state to the new joiner if it exists
      if (canvasStates[room]) {
        socket.emit('canvas-state', { room, imageData: canvasStates[room] });
      }
      
      // Notify existing members that this user joined
      socket.to(room).emit('user joined', { userId: socket.id, username: socket.username });
      console.log(`User ${socket.id} joined room ${room}`);
    } else {
      socket.emit('error', 'Room not found');
    }
  });

  socket.on('chat message', (data) => {
    console.log('Chat message received:', data);
    console.log('Socket rooms:', [...socket.rooms]);
    io.to(data.room).emit('chat message', {
      user: data.user,
      msg: data.msg,
      timestamp: data.timestamp,
      userId: socket.id
    });
  });

  socket.on('typing', (data) => {
    socket.to(data.room).emit('typing', { user: data.user });
  });

  socket.on('stop typing', (data) => {
    socket.to(data.room).emit('stop typing', { user: data.user });
  });

  // Canvas events for collaborative drawing
  socket.on('canvas-draw', (data) => {
    console.log('Canvas draw event received:', data.tool || 'brush');
    socket.to(data.room).emit('canvas-draw', data);
  });

  socket.on('canvas-clear', (data) => {
    console.log('Canvas clear event received:', data);
    canvasStates[data.room] = null; // Clear stored state
    socket.to(data.room).emit('canvas-clear', data);
  });

  socket.on('canvas-undo', (data) => {
    console.log('Canvas undo event received:', data);
    if (data.imageData) {
      canvasStates[data.room] = data.imageData; // Update stored state
    }
    socket.to(data.room).emit('canvas-undo', data);
  });

  socket.on('canvas-save-state', (data) => {
    console.log('Canvas state save received for room:', data.room);
    canvasStates[data.room] = data.imageData;
  });

  socket.on('request-canvas-state', (data) => {
    console.log('Canvas state requested for room:', data.room);
    if (canvasStates[data.room]) {
      socket.emit('canvas-state', { room: data.room, imageData: canvasStates[data.room] });
    }
  });

  socket.on('canvas-opened', (data) => {
    console.log('Canvas opened by user in room:', data.room);
    // Broadcast to all users in room that someone opened canvas
    // This triggers them to sync their canvas state if they have it open
    socket.to(data.room).emit('canvas-sync-request', data);
  });

  socket.on('file share', (data) => {
    console.log('File share event received:', data.fileName);
    socket.to(data.room).emit('file shared', data);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    for (const room in rooms) {
      const index = rooms[room].users.indexOf(socket.id);
      if (index !== -1) {
        rooms[room].users.splice(index, 1);
        socket.to(room).emit('user left', { userId: socket.id, username: socket.username });
        console.log(`User ${socket.id} left room ${room}`);
        break;
      }
    }
  });
});

// Serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});

module.exports = app;
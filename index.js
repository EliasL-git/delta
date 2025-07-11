const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const path = require('path');

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://*.vercel.app", "https://*.vercel.com"] 
      : ["http://localhost:3000", "http://localhost:3001", "http://localhost:5000"],
    methods: ["GET", "POST"]
  }
});

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
}

const rooms = {};

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('create room', () => {
    const room = Math.random().toString(36).substring(2, 12);
    rooms[room] = { users: [] };
    socket.join(room);
    rooms[room].users.push(socket.id);
    socket.emit('room created', room);
    // Notify that this user joined the room they created
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
    socket.to(data.room).emit('canvas-clear', data);
  });

  socket.on('canvas-undo', (data) => {
    console.log('Canvas undo event received:', data);
    socket.to(data.room).emit('canvas-undo', data);
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

// Serve React app for any other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});

module.exports = app;
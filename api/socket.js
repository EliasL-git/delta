const { Server } = require('socket.io');

let io;

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO server...');
    io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    const rooms = {};

    io.on('connection', (socket) => {
      console.log('a user connected');

      socket.on('create room', () => {
        const room = Math.random().toString(36).substring(2, 12);
        rooms[room] = { users: [] };
        socket.join(room);
        rooms[room].users.push(socket.id);
        socket.emit('room created', room);
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

    res.socket.server.io = io;
  } else {
    console.log('Socket.IO server already running');
  }
  res.end();
}

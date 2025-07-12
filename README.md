# Delta Chat - Real-time Chat Application

A real-time chat application with collaborative canvas built with React, Node.js, Express, and Socket.IO.

## Features

- 🚀 Real-time messaging
- 🎨 Collaborative canvas with drawing tools
- 📁 File sharing (images, documents)
- 👥 Online user tracking
- 📱 Responsive design
- 🐳 Docker ready

## Quick Start with Docker

### Build and run locally:
```bash
docker build -t delta-chat .
docker run -p 3000:3000 delta-chat
```

### Using Docker Compose:
```bash
docker-compose up --build
```

## Deployment with Coolify

1. **Connect your Git repository** to Coolify
2. **Set application type** to "Docker"
3. **Configure build settings:**
   - **Port:** `3000`
   - **Dockerfile path:** `./Dockerfile`
   - **Build context:** `./`

4. **Environment variables (optional):**
   - `NODE_ENV=production`
   - `PORT=3000`

5. **Deploy!** Coolify will automatically build and deploy your application.

## Development

### Local development without Docker:
```bash
npm install
npm run devserver  # Starts both server and client
```

### Scripts:
- `npm start` - Start production server
- `npm run dev` - Start React development server
- `npm run server` - Start Node.js server only
- `npm run devserver` - Start both server and client concurrently
- `npm run build` - Build React app for production

## Architecture

- **Frontend:** React with Socket.IO client
- **Backend:** Express.js with Socket.IO server
- **Real-time:** WebSocket connections via Socket.IO
- **File handling:** Base64 encoding for file transfers

## Docker Configuration

The application is containerized with:
- **Base image:** Node.js 18 Alpine
- **Port:** 3000
- **Health checks:** Included
- **Security:** Non-root user execution
- **Optimization:** Multi-stage build with production dependencies only

## Canvas Features

- 🖌️ Brush tool with adjustable size
- 🧽 Eraser tool
- 📏 Line drawing
- ⭕ Circle drawing
- ⬜ Rectangle drawing
- 🎨 Color palette
- ↶↷ Undo/Redo functionality
- 💾 Export canvas as PNG
- 🗑️ Clear canvas
- 👥 Real-time collaborative drawing

Perfect for teams, classrooms, or casual conversations with friends!

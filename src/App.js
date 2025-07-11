import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

// Use the current host in production, localhost in development
const socketUrl = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:3000';
const socket = io(socketUrl);

function App() {
  const [room, setRoom] = useState('');
  const [roomCreated, setRoomCreated] = useState(false);
  const [username, setUsername] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  const createRoom = () => {
    setShowUsernameModal(true);
  };

  const handleUsernameSubmit = (enteredUsername) => {
    console.log('🔧 handleUsernameSubmit called with username:', enteredUsername);
    setUsername(enteredUsername);
    setShowUsernameModal(false);
    console.log('📡 Emitting set username and create room events...');
    socket.emit('set username', enteredUsername);
    socket.emit('create room');
  };

  useEffect(() => {
    console.log('🔌 Setting up socket listeners...');
    
    socket.on('room created', (newRoom) => {
      console.log('✅ Room created event received:', newRoom);
      setRoom(newRoom);
      setRoomCreated(true);
    });

    socket.on('joined room', (joinedRoom) => {
      console.log('✅ Joined room event received:', joinedRoom);
      setRoom(joinedRoom);
      setRoomCreated(true);
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error received:', error);
      alert(error);
    });

    socket.on('connect', () => {
      console.log('🔗 Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    return () => {
      socket.off('room created');
      socket.off('joined room');
      socket.off('error');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const joinRoom = () => {
    const roomToJoin = prompt('Enter room code:');
    if (roomToJoin) {
      setShowUsernameModal(true);
      // Store the room to join for later use
      window.tempRoomToJoin = roomToJoin;
    }
  };

  const handleJoinWithUsername = (enteredUsername) => {
    setUsername(enteredUsername);
    setShowUsernameModal(false);
    socket.emit('set username', enteredUsername);
    if (window.tempRoomToJoin) {
      socket.emit('join room', window.tempRoomToJoin);
      delete window.tempRoomToJoin;
    }
  };

  return (
    <div className="app">
      {!roomCreated ? (
        <div className="landing-container">
          <div className="landing-content">
            <div className="logo-section">
              <div className="logo">
                <div className="logo-icon">💬</div>
                <h1 className="logo-text">Delta Chat</h1>
              </div>
              <p className="logo-subtitle">Connect with others instantly</p>
            </div>
            
            <div className="action-cards">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Create Room</h3>
                  <p className="card-description">Start a new conversation and invite others</p>
                </div>
                <button className="btn btn-primary" onClick={createRoom}>
                  <span className="btn-icon">➕</span>
                  Generate Room Code
                </button>
              </div>
              
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Join Room</h3>
                  <p className="card-description">Enter a room code to join an existing conversation</p>
                </div>
                <button className="btn btn-outline" onClick={joinRoom}>
                  <span className="btn-icon">🔗</span>
                  Join Room
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Chat room={room} username={username} />
      )}
      
      {showUsernameModal && (
        <UsernameModal
          onSubmit={window.tempRoomToJoin ? handleJoinWithUsername : handleUsernameSubmit}
          onClose={() => setShowUsernameModal(false)}
        />
      )}
    </div>
  );
}

function UsernameModal({ onSubmit, onClose }) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('🔧 UsernameModal form submitted with username:', username);
    if (username.trim()) {
      console.log('✅ Username is valid, calling onSubmit...');
      onSubmit(username.trim());
    } else {
      console.log('❌ Username is empty or invalid');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Enter Your Username</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="input-group">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username..."
              className="input"
              autoFocus
              maxLength={20}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!username.trim()}>
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Chat({ room, username }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState([]);
  const [showCanvas, setShowCanvas] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    console.log('🔌 Setting up Chat socket listeners...');
    
    socket.on('chat message', (data) => {
      console.log('📨 Chat message received:', data);
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on('user joined', (data) => {
      console.log('👋 User joined:', data);
      setMessages((prevMessages) => [...prevMessages, { 
        user: 'System', 
        msg: `${data.username || data.userId} joined the chat`,
        timestamp: new Date(),
        isSystem: true
      }]);
      setOnlineUsers((prev) => [...prev, data]);
    });

    socket.on('user left', (data) => {
      console.log('👋 User left:', data);
      setMessages((prevMessages) => [...prevMessages, { 
        user: 'System', 
        msg: `${data.username || data.userId} left the chat`,
        timestamp: new Date(),
        isSystem: true
      }]);
      setOnlineUsers((prev) => prev.filter(user => user.userId !== data.userId));
    });

    socket.on('typing', (data) => {
      setIsTyping((prev) => [...prev.filter(u => u !== data.user), data.user]);
    });

    socket.on('stop typing', (data) => {
      setIsTyping((prev) => prev.filter(u => u !== data.user));
    });

    socket.on('file shared', (data) => {
      console.log('📎 File shared:', data);
      setMessages((prevMessages) => [...prevMessages, {
        user: data.user,
        msg: data.fileName,
        timestamp: new Date(data.timestamp),
        isFile: true,
        fileData: data.fileData,
        fileType: data.fileType,
        fileSize: data.fileSize
      }]);
    });

    return () => {
      socket.off('chat message');
      socket.off('user joined');
      socket.off('user left');
      socket.off('typing');
      socket.off('stop typing');
      socket.off('file shared');
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    console.log('🔧 sendMessage called');
    console.log('📝 Input value:', input);
    console.log('🏠 Room:', room);
    console.log('👤 Username:', username);
    
    if (input.trim()) {
      console.log('📡 Emitting chat message...');
      socket.emit('chat message', { 
        room, 
        msg: input.trim(),
        user: username,
        timestamp: new Date()
      });
      setInput('');
      console.log('✅ Message sent and input cleared');
    } else {
      console.log('❌ Input is empty, not sending message');
    }
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    socket.emit('typing', { room, user: username });
    
    // Stop typing after 1 second of inactivity
    clearTimeout(window.typingTimer);
    window.typingTimer = setTimeout(() => {
      socket.emit('stop typing', { room, user: username });
    }, 1000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const toggleCanvas = () => {
    setShowCanvas(!showCanvas);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // File size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large! Maximum size is 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = event.target.result;
      socket.emit('file share', {
        room,
        fileName: file.name,
        fileData,
        fileType: file.type,
        fileSize: file.size,
        user: username,
        timestamp: new Date()
      });
      
      // Add to local messages
      setMessages((prevMessages) => [...prevMessages, {
        user: username,
        msg: file.name,
        timestamp: new Date(),
        isFile: true,
        fileData,
        fileType: file.type,
        fileSize: file.size
      }]);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset file input
  };

  const downloadFile = (fileData, fileName) => {
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName;
    link.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="chat-layout">
      {/* Header */}
      <div className="chat-header">
        <div className="channel-info">
          <span className="channel-name"># {room}</span>
          <span className="channel-topic">Room chat • {onlineUsers.length + 1} members</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost btn-sm" onClick={toggleCanvas} title="Open Canvas">
            <span>🎨</span>
          </button>
          <button className="btn btn-ghost btn-sm">
            <span>👥</span>
          </button>
          <button className="btn btn-ghost btn-sm">
            <span>⚙️</span>
          </button>
        </div>
      </div>

      <div className="chat-body">
        {/* Messages Area */}
        <div className="messages-container">
          <div className="welcome-message">
            <div className="welcome-icon">🎉</div>
            <h3>Welcome to #{room}!</h3>
            <p>This is the beginning of your conversation in this room.</p>
          </div>
          
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.isSystem ? 'system-message' : ''} ${message.user === username ? 'own-message' : ''}`}
            >
              {!message.isSystem && (
                <div className="message-avatar">
                  {getInitials(message.user)}
                </div>
              )}
              <div className="message-content">
                {!message.isSystem && (
                  <div className="message-header">
                    <span className="message-username">{message.user}</span>
                    <span className="message-timestamp">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                )}
                {message.isFile ? (
                  <div className="file-message">
                    <div className="file-info">
                      <span className="file-icon">
                        {message.fileType?.startsWith('image/') ? '🖼️' : 
                         message.fileType?.startsWith('video/') ? '🎥' :
                         message.fileType?.startsWith('audio/') ? '🎵' :
                         message.fileType?.includes('pdf') ? '📄' : '📎'}
                      </span>
                      <div className="file-details">
                        <span className="file-name">{message.msg}</span>
                        <span className="file-size">{formatFileSize(message.fileSize)}</span>
                      </div>
                    </div>
                    {message.fileType?.startsWith('image/') && (
                      <img 
                        src={message.fileData} 
                        alt={message.msg}
                        className="file-preview"
                        onClick={() => downloadFile(message.fileData, message.msg)}
                      />
                    )}
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => downloadFile(message.fileData, message.msg)}
                    >
                      Download
                    </button>
                  </div>
                ) : (
                  <div className="message-text">{message.msg}</div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping.length > 0 && (
            <div className="typing-indicator">
              <div className="typing-content">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="typing-text">
                  {isTyping.filter(u => u !== username).join(', ')} 
                  {isTyping.filter(u => u !== username).length === 1 ? ' is' : ' are'} typing...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="message-input-container">
          <form onSubmit={sendMessage} className="message-form">
            <div className="input-wrapper">
              <button 
                type="button" 
                className="file-button"
                onClick={() => fileInputRef.current?.click()}
                title="Share File"
              >
                📎
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                accept="image/*,video/*,audio/*,.pdf,.txt,.doc,.docx"
              />
              <input
                type="text"
                value={input}
                onChange={handleTyping}
                placeholder={`Message #${room}`}
                className="message-input"
              />
              <button 
                type="submit" 
                className="send-button"
                disabled={!input.trim()}
              >
                <span className="send-icon">➤</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Collaborative Canvas */}
      {showCanvas && (
        <CollaborativeCanvas 
          room={room} 
          username={username} 
          onClose={() => setShowCanvas(false)} 
        />
      )}
    </div>
  );
}

function CollaborativeCanvas({ room, username, onClose }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState('brush'); // brush, eraser, line, circle, rect
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [startPos, setStartPos] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Save initial state to history
    saveToHistory(canvas);

    // Listen for drawing events from other users
    socket.on('canvas-draw', (data) => {
      if (data.room === room) {
        if (data.tool === 'brush' || data.tool === 'eraser') {
          drawLine(ctx, data.prevX, data.prevY, data.currentX, data.currentY, data.color, data.brushSize);
        } else if (data.tool === 'line') {
          drawLine(ctx, data.startX, data.startY, data.endX, data.endY, data.color, data.brushSize);
        } else if (data.tool === 'circle') {
          drawCircle(ctx, data.centerX, data.centerY, data.radius, data.color, data.brushSize);
        } else if (data.tool === 'rect') {
          drawRect(ctx, data.x, data.y, data.width, data.height, data.color, data.brushSize);
        }
      }
    });

    socket.on('canvas-clear', (data) => {
      if (data.room === room) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHistory([]);
        setHistoryIndex(-1);
        saveToHistory(canvas);
      }
    });

    socket.on('canvas-undo', (data) => {
      if (data.room === room && data.imageData) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = data.imageData;
      }
    });

    return () => {
      socket.off('canvas-draw');
      socket.off('canvas-clear');
      socket.off('canvas-undo');
    };
  }, [room, saveToHistory]);

  const saveToHistory = (canvas) => {
    const imageData = canvas.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const drawLine = (ctx, x1, y1, x2, y2, strokeColor, strokeWidth) => {
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const drawCircle = (ctx, centerX, centerY, radius, strokeColor, strokeWidth) => {
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const drawRect = (ctx, x, y, width, height, strokeColor, strokeWidth) => {
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.rect(x, y, width, height);
    ctx.stroke();
  };

  const getCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCoordinates(e);
    setStartPos(coords);
    
    if (tool === 'brush' || tool === 'eraser') {
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const coords = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');

    if (tool === 'brush' || tool === 'eraser') {
      const drawColor = tool === 'eraser' ? '#000000' : color;
      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;
      const prevX = coords.x - movementX;
      const prevY = coords.y - movementY;

      drawLine(ctx, prevX, prevY, coords.x, coords.y, drawColor, brushSize);

      // Send drawing data to other users
      socket.emit('canvas-draw', {
        room,
        tool,
        prevX,
        prevY,
        currentX: coords.x,
        currentY: coords.y,
        color: drawColor,
        brushSize,
        username
      });
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    e?.preventDefault();
    setIsDrawing(false);
    
    const coords = getCoordinates(e || {});
    const ctx = canvasRef.current.getContext('2d');

    if (tool === 'line' && startPos) {
      drawLine(ctx, startPos.x, startPos.y, coords.x, coords.y, color, brushSize);
      socket.emit('canvas-draw', {
        room,
        tool: 'line',
        startX: startPos.x,
        startY: startPos.y,
        endX: coords.x,
        endY: coords.y,
        color,
        brushSize,
        username
      });
    } else if (tool === 'circle' && startPos) {
      const radius = Math.sqrt(Math.pow(coords.x - startPos.x, 2) + Math.pow(coords.y - startPos.y, 2));
      drawCircle(ctx, startPos.x, startPos.y, radius, color, brushSize);
      socket.emit('canvas-draw', {
        room,
        tool: 'circle',
        centerX: startPos.x,
        centerY: startPos.y,
        radius,
        color,
        brushSize,
        username
      });
    } else if (tool === 'rect' && startPos) {
      const width = coords.x - startPos.x;
      const height = coords.y - startPos.y;
      drawRect(ctx, startPos.x, startPos.y, width, height, color, brushSize);
      socket.emit('canvas-draw', {
        room,
        tool: 'rect',
        x: startPos.x,
        y: startPos.y,
        width,
        height,
        color,
        brushSize,
        username
      });
    }

    // Save to history after drawing
    saveToHistory(canvasRef.current);
    setStartPos(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    socket.emit('canvas-clear', { room, username });
    setHistory([]);
    setHistoryIndex(-1);
    saveToHistory(canvas);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[newIndex];
      
      // Send undo to other users
      socket.emit('canvas-undo', { 
        room, 
        username, 
        imageData: history[newIndex] 
      });
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[newIndex];
      
      // Send redo to other users
      socket.emit('canvas-undo', { 
        room, 
        username, 
        imageData: history[newIndex] 
      });
    }
  };

  const saveImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `delta-canvas-${room}-${new Date().getTime()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const colors = ['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080', '#008000'];
  const tools = [
    { id: 'brush', icon: '🖌️', name: 'Brush' },
    { id: 'eraser', icon: '🧽', name: 'Eraser' },
    { id: 'line', icon: '📏', name: 'Line' },
    { id: 'circle', icon: '⭕', name: 'Circle' },
    { id: 'rect', icon: '⬜', name: 'Rectangle' }
  ];

  return (
    <div className="canvas-overlay">
      <div className="canvas-container">
        <div className="canvas-header">
          <h3>🎨 Collaborative Canvas</h3>
          <div className="canvas-controls">
            <div className="tool-palette">
              {tools.map(t => (
                <button
                  key={t.id}
                  className={`tool-btn ${tool === t.id ? 'active' : ''}`}
                  onClick={() => setTool(t.id)}
                  title={t.name}
                >
                  {t.icon}
                </button>
              ))}
            </div>
            
            <div className="color-palette">
              {colors.map(c => (
                <button
                  key={c}
                  className={`color-btn ${color === c ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            
            <div className="brush-size">
              <label>Size: </label>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(e.target.value)}
                className="brush-slider"
              />
              <span>{brushSize}px</span>
            </div>
            
            <div className="canvas-actions">
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={undo}
                disabled={historyIndex <= 0}
                title="Undo"
              >
                ↶
              </button>
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                title="Redo"
              >
                ↷
              </button>
              <button className="btn btn-outline btn-sm" onClick={saveImage} title="Save Image">
                💾
              </button>
              <button className="btn btn-outline btn-sm" onClick={clearCanvas} title="Clear Canvas">
                🗑️
              </button>
              <button className="btn btn-ghost btn-sm" onClick={onClose} title="Close Canvas">
                ✕
              </button>
            </div>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="drawing-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ touchAction: 'none' }}
        />
      </div>
    </div>
  );
}

export default App;
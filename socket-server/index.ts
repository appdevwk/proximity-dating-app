import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.SOCKET_PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Enable CORS
app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST']
}));

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store active users and rooms
const activeUsers = new Map<string, { userId: string; username: string; socketId: string }>();
const activeRooms = new Map<string, { users: string[]; messages: any[] }>();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Handle user joining
  socket.on('user:join', (userData: { userId: string; username: string }) => {
    const { userId, username } = userData;
    
    // Store user info
    activeUsers.set(socket.id, { userId, username, socketId: socket.id });
    
    // Broadcast user joined to all clients
    socket.broadcast.emit('user:joined', {
      userId,
      username,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
    
    // Send current user list to the connected user
    const userList = Array.from(activeUsers.values());
    socket.emit('users:list', userList);
    
    console.log(`👤 User ${username} (${userId}) joined`);
  });

  // Handle private messaging
  socket.on('message:private', (data: {
    toUserId: string;
    message: string;
    fromUserId: string;
    fromUsername: string;
  }) => {
    const { toUserId, message, fromUserId, fromUsername } = data;
    
    // Find target user's socket
    const targetUser = Array.from(activeUsers.values()).find(user => user.userId === toUserId);
    
    if (targetUser) {
      // Send message to target user
      io.to(targetUser.socketId).emit('message:private', {
        fromUserId,
        fromUsername,
        message,
        timestamp: new Date().toISOString()
      });
      
      // Send confirmation back to sender
      socket.emit('message:sent', {
        toUserId,
        message,
        timestamp: new Date().toISOString()
      });
    } else {
      // User not found
      socket.emit('error:user-not-found', {
        userId: toUserId,
        message: 'User not found or offline'
      });
    }
  });

  // Handle room joining
  socket.on('room:join', (data: { roomId: string; userId: string; username: string }) => {
    const { roomId, userId, username } = data;
    
    // Join room
    socket.join(roomId);
    
    // Initialize room if it doesn't exist
    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, { users: [], messages: [] });
    }
    
    const room = activeRooms.get(roomId)!;
    
    // Add user to room
    if (!room.users.includes(userId)) {
      room.users.push(userId);
    }
    
    // Notify room members
    io.to(roomId).emit('room:user-joined', {
      roomId,
      userId,
      username,
      timestamp: new Date().toISOString()
    });
    
    // Send room history to user
    socket.emit('room:history', {
      roomId,
      messages: room.messages
    });
    
    console.log(`🏠 User ${username} joined room ${roomId}`);
  });

  // Handle room messages
  socket.on('room:message', (data: {
    roomId: string;
    message: string;
    userId: string;
    username: string;
  }) => {
    const { roomId, message, userId, username } = data;
    
    const messageData = {
      id: uuidv4(),
      userId,
      username,
      message,
      timestamp: new Date().toISOString()
    };
    
    // Store message in room history
    const room = activeRooms.get(roomId);
    if (room) {
      room.messages.push(messageData);
    }
    
    // Broadcast message to room
    io.to(roomId).emit('room:message', messageData);
    
    console.log(`💬 Message in room ${roomId}: ${message}`);
  });

  // Handle typing indicators
  socket.on('typing:start', (data: { roomId: string; username: string }) => {
    socket.to(data.roomId).emit('typing:start', {
      username: data.username,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('typing:stop', (data: { roomId: string; username: string }) => {
    socket.to(data.roomId).emit('typing:stop', {
      username: data.username,
      timestamp: new Date().toISOString()
    });
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      // Remove user from active users
      activeUsers.delete(socket.id);
      
      // Remove user from all rooms
      activeRooms.forEach((room, roomId) => {
        const userIndex = room.users.indexOf(user.userId);
        if (userIndex > -1) {
          room.users.splice(userIndex, 1);
          
          // Notify room members
          io.to(roomId).emit('room:user-left', {
            roomId,
            userId: user.userId,
            username: user.username,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      // Broadcast user left to all clients
      socket.broadcast.emit('user:left', {
        userId: user.userId,
        username: user.username,
        timestamp: new Date().toISOString()
      });
      
      console.log(`👋 User ${user.username} (${user.userId}) disconnected`);
    }
  });

  // Handle ping/pong for connection health
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });

  // Send welcome message
  socket.emit('welcome', {
    message: 'Connected to PROXIMITY Socket.IO server',
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeUsers: activeUsers.size,
    activeRooms: activeRooms.size,
    uptime: process.uptime()
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 PROXIMITY Socket.IO server running on port ${PORT}`);
  console.log(`🌐 WebSocket server: ws://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 Client URL: ${CLIENT_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Socket.IO server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Socket.IO server closed');
    process.exit(0);
  });
});
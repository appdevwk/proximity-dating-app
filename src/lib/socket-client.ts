import { io, Socket } from 'socket.io-client';

export interface SocketClientOptions {
  userId?: string;
  username?: string;
  autoConnect?: boolean;
}

interface MessageData {
  toUserId: string;
  message: string;
  fromUserId: string;
  fromUsername: string;
}

interface RoomData {
  roomId: string;
  userId: string;
  username: string;
}

interface RoomMessageData {
  roomId: string;
  message: string;
  userId: string;
  username: string;
}

interface TypingData {
  roomId: string;
  username: string;
}

export class SocketClient {
  private socket: Socket | null = null;
  private userId: string;
  private username: string;
  private isConnected: boolean = false;

  constructor(options: SocketClientOptions = {}) {
    this.userId = options.userId || '';
    this.username = options.username || '';
    
    // Initialize socket connection
    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      autoConnect: options.autoConnect || false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      this.isConnected = true;
      
      // Join with user info if available
      if (this.userId && this.username) {
        this.joinUser(this.userId, this.username);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Socket.IO server:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      this.isConnected = false;
    });

    // Welcome message
    this.socket.on('welcome', (data) => {
      console.log('🎉 Welcome message:', data);
    });

    // User events
    this.socket.on('user:joined', (data) => {
      console.log('👤 User joined:', data);
    });

    this.socket.on('user:left', (data) => {
      console.log('👋 User left:', data);
    });

    this.socket.on('users:list', (users) => {
      console.log('📋 Active users:', users);
    });

    // Private messaging events
    this.socket.on('message:private', (data) => {
      console.log('💬 Private message received:', data);
    });

    this.socket.on('message:sent', (data) => {
      console.log('✅ Message sent confirmation:', data);
    });

    this.socket.on('error:user-not-found', (data) => {
      console.error('❌ User not found:', data);
    });

    // Room events
    this.socket.on('room:user-joined', (data) => {
      console.log('🏠 User joined room:', data);
    });

    this.socket.on('room:user-left', (data) => {
      console.log('🏠 User left room:', data);
    });

    this.socket.on('room:history', (data) => {
      console.log('📜 Room history:', data);
    });

    this.socket.on('room:message', (data) => {
      console.log('💬 Room message:', data);
    });

    // Typing events
    this.socket.on('typing:start', (data) => {
      console.log('⌨️ User started typing:', data);
    });

    this.socket.on('typing:stop', (data) => {
      console.log('⏹️ User stopped typing:', data);
    });

    // Ping/pong for connection health
    this.socket.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });
  }

  // Connection methods
  connect() {
    if (this.socket && !this.isConnected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket && this.isConnected) {
      this.socket.disconnect();
    }
  }

  // User methods
  joinUser(userId: string, username: string) {
    this.userId = userId;
    this.username = username;
    
    if (this.socket && this.isConnected) {
      this.socket.emit('user:join', { userId, username });
    }
  }

  // Private messaging methods
  sendPrivateMessage(toUserId: string, message: string) {
    if (this.socket && this.isConnected && this.userId && this.username) {
      const messageData: MessageData = {
        toUserId,
        message,
        fromUserId: this.userId,
        fromUsername: this.username
      };
      
      this.socket.emit('message:private', messageData);
      return true;
    }
    return false;
  }

  // Room methods
  joinRoom(roomId: string) {
    if (this.socket && this.isConnected && this.userId && this.username) {
      const roomData: RoomData = {
        roomId,
        userId: this.userId,
        username: this.username
      };
      
      this.socket.emit('room:join', roomData);
      return true;
    }
    return false;
  }

  sendRoomMessage(roomId: string, message: string) {
    if (this.socket && this.isConnected && this.userId && this.username) {
      const roomMessageData: RoomMessageData = {
        roomId,
        message,
        userId: this.userId,
        username: this.username
      };
      
      this.socket.emit('room:message', roomMessageData);
      return true;
    }
    return false;
  }

  leaveRoom(roomId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('room:leave', { roomId });
      return true;
    }
    return false;
  }

  // Typing indicators
  startTyping(roomId: string) {
    if (this.socket && this.isConnected && this.username) {
      const typingData: TypingData = {
        roomId,
        username: this.username
      };
      
      this.socket.emit('typing:start', typingData);
      return true;
    }
    return false;
  }

  stopTyping(roomId: string) {
    if (this.socket && this.isConnected && this.username) {
      const typingData: TypingData = {
        roomId,
        username: this.username
      };
      
      this.socket.emit('typing:stop', typingData);
      return true;
    }
    return false;
  }

  // Utility methods
  ping() {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping');
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      userId: this.userId,
      username: this.username,
      socketId: this.socket?.id || null
    };
  }

  // Event listeners for external use
  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Get socket instance for advanced usage
  getSocket() {
    return this.socket;
  }
}

// Singleton instance for global use
let socketClient: SocketClient | null = null;

export const getSocketClient = (options?: SocketClientOptions): SocketClient => {
  if (!socketClient) {
    socketClient = new SocketClient(options);
  }
  return socketClient;
};

export const initializeSocketClient = (options: SocketClientOptions): SocketClient => {
  socketClient = new SocketClient(options);
  return socketClient;
};

export const destroySocketClient = () => {
  if (socketClient) {
    socketClient.disconnect();
    socketClient = null;
  }
};
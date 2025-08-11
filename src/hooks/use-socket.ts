'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { SocketClient, SocketClientOptions } from '@/lib/socket-client';

interface UseSocketOptions extends SocketClientOptions {
  autoConnect?: boolean;
}

interface UseSocketReturn {
  socketClient: SocketClient | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  joinUser: (userId: string, username: string) => void;
  sendPrivateMessage: (toUserId: string, message: string) => boolean;
  joinRoom: (roomId: string) => boolean;
  sendRoomMessage: (roomId: string, message: string) => boolean;
  leaveRoom: (roomId: string) => boolean;
  startTyping: (roomId: string) => boolean;
  stopTyping: (roomId: string) => boolean;
  ping: () => void;
  connectionStatus: any;
}

export const useSocket = (options: UseSocketOptions = {}): UseSocketReturn => {
  const [socketClient, setSocketClient] = useState<SocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  
  const socketRef = useRef<SocketClient | null>(null);
  const optionsRef = useRef(options);

  // Initialize socket client
  useEffect(() => {
    const client = new SocketClient({
      ...optionsRef.current,
      autoConnect: optionsRef.current.autoConnect || false,
    });

    socketRef.current = client;
    setSocketClient(client);

    // Set up connection status listener
    const handleConnectionChange = () => {
      const status = client.getConnectionStatus();
      setIsConnected(status.isConnected);
      setConnectionStatus(status);
    };

    // Listen for connection events
    client.on('connect', handleConnectionChange);
    client.on('disconnect', handleConnectionChange);

    // Initial status check
    handleConnectionChange();

    return () => {
      client.off('connect', handleConnectionChange);
      client.off('disconnect', handleConnectionChange);
      client.disconnect();
    };
  }, []);

  // Auto-connect if enabled
  useEffect(() => {
    if (options.autoConnect && socketClient) {
      socketClient.connect();
    }
  }, [options.autoConnect, socketClient]);

  // Connection methods
  const connect = useCallback(() => {
    if (socketClient) {
      socketClient.connect();
    }
  }, [socketClient]);

  const disconnect = useCallback(() => {
    if (socketClient) {
      socketClient.disconnect();
    }
  }, [socketClient]);

  // User methods
  const joinUser = useCallback((userId: string, username: string) => {
    if (socketClient) {
      socketClient.joinUser(userId, username);
    }
  }, [socketClient]);

  // Private messaging methods
  const sendPrivateMessage = useCallback((toUserId: string, message: string) => {
    if (socketClient) {
      return socketClient.sendPrivateMessage(toUserId, message);
    }
    return false;
  }, [socketClient]);

  // Room methods
  const joinRoom = useCallback((roomId: string) => {
    if (socketClient) {
      return socketClient.joinRoom(roomId);
    }
    return false;
  }, [socketClient]);

  const sendRoomMessage = useCallback((roomId: string, message: string) => {
    if (socketClient) {
      return socketClient.sendRoomMessage(roomId, message);
    }
    return false;
  }, [socketClient]);

  const leaveRoom = useCallback((roomId: string) => {
    if (socketClient) {
      return socketClient.leaveRoom(roomId);
    }
    return false;
  }, [socketClient]);

  // Typing indicators
  const startTyping = useCallback((roomId: string) => {
    if (socketClient) {
      return socketClient.startTyping(roomId);
    }
    return false;
  }, [socketClient]);

  const stopTyping = useCallback((roomId: string) => {
    if (socketClient) {
      return socketClient.stopTyping(roomId);
    }
    return false;
  }, [socketClient]);

  // Utility methods
  const ping = useCallback(() => {
    if (socketClient) {
      socketClient.ping();
    }
  }, [socketClient]);

  return {
    socketClient,
    isConnected,
    connect,
    disconnect,
    joinUser,
    sendPrivateMessage,
    joinRoom,
    sendRoomMessage,
    leaveRoom,
    startTyping,
    stopTyping,
    ping,
    connectionStatus,
  };
};

// Hook for listening to specific socket events
export const useSocketEvent = (
  socketClient: SocketClient | null,
  eventName: string,
  callback: (data: any) => void
) => {
  useEffect(() => {
    if (!socketClient) return;

    const handler = (data: any) => {
      callback(data);
    };

    socketClient.on(eventName, handler);

    return () => {
      socketClient.off(eventName, handler);
    };
  }, [socketClient, eventName, callback]);
};

// Hook for managing room state
export const useSocketRoom = (
  socketClient: SocketClient | null,
  roomId: string,
  options: { autoJoin?: boolean } = {}
) => {
  const [isInRoom, setIsInRoom] = useState(false);
  const [roomMessages, setRoomMessages] = useState<any[]>([]);
  const [roomUsers, setRoomUsers] = useState<any[]>([]);

  // Join room automatically if enabled
  useEffect(() => {
    if (socketClient && options.autoJoin && roomId && !isInRoom) {
      const joined = socketClient.joinRoom(roomId);
      if (joined) {
        setIsInRoom(true);
      }
    }
  }, [socketClient, roomId, options.autoJoin, isInRoom]);

  // Listen for room events
  useSocketEvent(socketClient, 'room:history', (data) => {
    if (data.roomId === roomId) {
      setRoomMessages(data.messages || []);
    }
  });

  useSocketEvent(socketClient, 'room:message', (data) => {
    if (data.roomId === roomId) {
      setRoomMessages(prev => [...prev, data]);
    }
  });

  useSocketEvent(socketClient, 'room:user-joined', (data) => {
    if (data.roomId === roomId) {
      setRoomUsers(prev => [...prev, data]);
    }
  });

  useSocketEvent(socketClient, 'room:user-left', (data) => {
    if (data.roomId === roomId) {
      setRoomUsers(prev => prev.filter(user => user.userId !== data.userId));
    }
  });

  const sendMessage = useCallback((message: string) => {
    if (socketClient && isInRoom) {
      return socketClient.sendRoomMessage(roomId, message);
    }
    return false;
  }, [socketClient, isInRoom, roomId]);

  const leaveRoom = useCallback(() => {
    if (socketClient && isInRoom) {
      const left = socketClient.leaveRoom(roomId);
      if (left) {
        setIsInRoom(false);
        setRoomMessages([]);
        setRoomUsers([]);
      }
      return left;
    }
    return false;
  }, [socketClient, isInRoom, roomId]);

  return {
    isInRoom,
    roomMessages,
    roomUsers,
    sendMessage,
    leaveRoom,
  };
};

// Hook for managing private messaging
export const useSocketPrivateMessaging = (
  socketClient: SocketClient | null,
  targetUserId: string
) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Listen for private messages
  useSocketEvent(socketClient, 'message:private', (data) => {
    if (data.fromUserId === targetUserId) {
      setMessages(prev => [...prev, data]);
    }
  });

  useSocketEvent(socketClient, 'message:sent', (data) => {
    if (data.toUserId === targetUserId) {
      setMessages(prev => [...prev, {
        ...data,
        direction: 'sent',
        timestamp: new Date().toISOString()
      }]);
    }
  });

  const sendMessage = useCallback((message: string) => {
    if (socketClient) {
      return socketClient.sendPrivateMessage(targetUserId, message);
    }
    return false;
  }, [socketClient, targetUserId]);

  return {
    messages,
    isTyping,
    sendMessage,
  };
};
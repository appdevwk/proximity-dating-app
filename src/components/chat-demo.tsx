'use client';

import { useState, useEffect } from 'react';
import { useSocket, useSocketRoom } from '@/hooks/use-socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Send, Users, MessageSquare, LogOut } from 'lucide-react';

interface ChatDemoProps {
  userId?: string;
  username?: string;
}

export const ChatDemo: React.FC<ChatDemoProps> = ({
  userId = 'demo-user-' + Math.random().toString(36).substr(2, 9),
  username = 'Demo User',
}) => {
  const [roomId, setRoomId] = useState('demo-room');
  const [message, setMessage] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  const {
    isConnected,
    connect,
    disconnect,
    joinUser,
  } = useSocket({
    userId,
    username,
    autoConnect: false,
  });

  const {
    isInRoom,
    roomMessages,
    roomUsers,
    sendMessage,
    leaveRoom,
  } = useSocketRoom(null, roomId, { autoJoin: false });

  // Connect to socket when component mounts
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Join user when connected
  useEffect(() => {
    if (isConnected && userId && username) {
      joinUser(userId, username);
    }
  }, [isConnected, userId, username, joinUser]);

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      setIsJoined(true);
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    setIsJoined(false);
  };

  const handleSendMessage = () => {
    if (message.trim() && isInRoom) {
      sendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            PROXIMITY Chat Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {username} ({userId})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {roomUsers.length} users
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Controls */}
      {!isJoined ? (
        <Card>
          <CardHeader>
            <CardTitle>Join Chat Room</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter room ID..."
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button onClick={handleJoinRoom} disabled={!roomId.trim() || !isConnected}>
                Join Room
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter a room ID to join the chat. Try "demo-room" or create your own!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Chat Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Room: {roomId}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleLeaveRoom}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Leave
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Active users: {roomUsers.map(u => u.username).join(', ') || 'None'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {roomMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  roomMessages.map((msg, index) => (
                    <div
                      key={msg.id || index}
                      className={`flex flex-col gap-1 ${
                        msg.userId === userId ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {msg.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                          msg.userId === userId
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Message Input */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={!isInRoom}
                />
                <Button onClick={handleSendMessage} disabled={!message.trim() || !isInRoom}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Make sure the Socket.IO server is running on port 3001</p>
          <p>2. Enter a room ID and click "Join Room"</p>
          <p>3. Type messages and press Enter to send</p>
          <p>4. Open multiple browser tabs to test with different users</p>
          <Separator className="my-2" />
          <p className="text-xs">
            <strong>Socket.IO Server:</strong> http://localhost:3001 | 
            <strong> Health Check:</strong> http://localhost:3001/health
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
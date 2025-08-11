'use client';

import { useSocket } from '@/hooks/use-socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Users, MessageSquare, Home } from 'lucide-react';

interface SocketStatusProps {
  userId?: string;
  username?: string;
  showControls?: boolean;
}

export const SocketStatus: React.FC<SocketStatusProps> = ({
  userId,
  username,
  showControls = true,
}) => {
  const {
    isConnected,
    connect,
    disconnect,
    ping,
    connectionStatus,
  } = useSocket({
    userId,
    username,
    autoConnect: false,
  });

  const handleConnect = () => {
    if (userId && username) {
      connect();
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handlePing = () => {
    ping();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
          Socket.IO Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connection:</span>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        {/* User Info */}
        {connectionStatus && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">User ID:</span>
              <span className="text-xs text-muted-foreground">
                {connectionStatus.userId || 'Not set'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Username:</span>
              <span className="text-xs text-muted-foreground">
                {connectionStatus.username || 'Not set'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Socket ID:</span>
              <span className="text-xs text-muted-foreground font-mono">
                {connectionStatus.socketId ? `${connectionStatus.socketId.slice(0, 8)}...` : 'N/A'}
              </span>
            </div>
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isConnected || !userId || !username}
                className="flex-1"
              >
                <Wifi className="h-4 w-4 mr-1" />
                Connect
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDisconnect}
                disabled={!isConnected}
                className="flex-1"
              >
                <WifiOff className="h-4 w-4 mr-1" />
                Disconnect
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePing}
              disabled={!isConnected}
              className="w-full"
            >
              Ping Server
            </Button>
          </div>
        )}

        {/* Server Info */}
        <div className="text-xs text-muted-foreground border-t pt-2">
          <div className="flex items-center gap-1">
            <Home className="h-3 w-3" />
            <span>Socket Server: http://localhost:3001</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <MessageSquare className="h-3 w-3" />
            <span>Health Check: http://localhost:3001/health</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
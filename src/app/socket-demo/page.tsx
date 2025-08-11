'use client';

import { SocketStatus } from '@/components/socket-status';
import { ChatDemo } from '@/components/chat-demo';

export default function SocketDemoPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">
          PROXIMITY Socket.IO Demo
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Test the real-time communication features of PROXIMITY dating app with our separate Socket.IO server.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SocketStatus
            userId="demo-user"
            username="Demo User"
            showControls={true}
          />
        </div>
        
        <div className="lg:col-span-2">
          <ChatDemo
            userId="demo-user"
            username="Demo User"
          />
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          This demo uses a separate Socket.IO server running on port 3001.
          Make sure to start the Socket.IO server before testing.
        </p>
      </div>
    </div>
  );
}
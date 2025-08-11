#!/bin/bash

# Proximity One-Click Launcher
# Simple script to launch Proximity with Cloudflare tunnel

echo "🚀 Starting Proximity One-Click Launcher..."
echo "============================================="

# Kill any existing processes
echo "🛑 Stopping existing processes..."
pkill -f "node\|tsx\|cloudflared" || true
sleep 2

# Start Next.js server
echo "🌐 Starting Next.js server..."
npm run dev > nextjs.log 2>&1 &
NEXTJS_PID=$!

# Wait for Next.js to start
echo "⏳ Waiting for Next.js to start..."
sleep 10

# Check if Next.js is running
if python3 -c "
import socket
import sys
import time

for i in range(15):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2)
        result = s.connect_ex(('127.0.0.1', 3001))
        if result == 0:
            print('SUCCESS')
            s.close()
            break
        s.close()
        time.sleep(2)
    except:
        pass
else:
    print('FAILED')
" | grep -q "SUCCESS"; then
    echo "✅ Next.js server started successfully"
else
    echo "❌ Failed to start Next.js server"
    echo "Check nextjs.log for errors"
    exit 1
fi

# Start Cloudflare tunnel
echo "🌍 Starting Cloudflare tunnel..."
nohup ./usr/bin/cloudflared tunnel --url http://localhost:3001 > cloudflared.log 2>&1 &
CLOUDFLARED_PID=$!

# Wait for Cloudflare URL
echo "⏳ Waiting for tunnel URL..."
sleep 5

# Extract URL from logs
TUNNEL_URL=$(grep -o "https://[a-z-]*\.trycloudflare\.com" cloudflared.log | head -1)

if [ -n "$TUNNEL_URL" ]; then
    echo "✅ Cloudflare tunnel started successfully"
    echo "🌐 Public URL: $TUNNEL_URL"
else
    echo "⚠️  Cloudflare tunnel starting... (URL may take a moment to appear)"
fi

echo ""
echo "🎉 Proximity Launched Successfully!"
echo "============================================="
echo "📱 Access your application:"
echo "   Local: http://localhost:3001"
if [ -n "$TUNNEL_URL" ]; then
    echo "   Public: $TUNNEL_URL"
fi
echo ""
echo "📝 Service Status:"
echo "   Next.js PID: $NEXTJS_PID"
echo "   Cloudflare PID: $CLOUDFLARED_PID"
echo ""
echo "🛑 To stop services, run: ./stop.sh"
echo "📊 To check status, run: ./status.sh"

# Keep the script running
echo "Press Ctrl+C to stop all services"
trap 'echo ""; echo "🛑 Stopping services..."; kill $NEXTJS_PID $CLOUDFLARED_PID 2>/dev/null; pkill -f "node\|tsx\|cloudflared"; exit 0' INT

# Wait indefinitely
while true; do
    sleep 1
done
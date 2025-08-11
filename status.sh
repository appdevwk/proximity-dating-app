#!/bin/bash

# Proximity Status Script
echo "📊 Proximity Service Status"
echo "================================"

# Check Next.js server
if pgrep -f "node\|tsx" > /dev/null; then
    echo "✅ Next.js server is running"
    
    # Check if it's responding
    if python3 -c "
import socket
import sys

try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(2)
    result = s.connect_ex(('127.0.0.1', 3001))
    if result == 0:
        print('RESPONDING')
    else:
        print('NOT_RESPONDING')
    s.close()
except:
    print('ERROR')
" 2>/dev/null | grep -q "RESPONDING"; then
        echo "   🌐 Server is responding on port 3001"
    else
        echo "   ⚠️  Server is not responding properly"
    fi
else
    echo "❌ Next.js server is not running"
fi

# Check Cloudflare tunnel
if pgrep -f "cloudflared" > /dev/null; then
    echo "✅ Cloudflare tunnel is running"
    
    # Show URL if available
    if [ -f "cloudflared.log" ]; then
        TUNNEL_URL=$(grep -o "https://[a-z-]*\.trycloudflare\.com" cloudflared.log | tail -1)
        if [ -n "$TUNNEL_URL" ]; then
            echo "   🌍 Public URL: $TUNNEL_URL"
        else
            echo "   ⏳ Tunnel URL not yet available"
        fi
    fi
else
    echo "❌ Cloudflare tunnel is not running"
fi

echo ""
echo "📱 Access URLs:"
echo "   Local: http://localhost:3001"

if [ -f "cloudflared.log" ]; then
    TUNNEL_URL=$(grep -o "https://[a-z-]*\.trycloudflare\.com" cloudflared.log | tail -1)
    if [ -n "$TUNNEL_URL" ]; then
        echo "   Public: $TUNNEL_URL"
    fi
fi

echo ""
echo "💡 Useful Commands:"
echo "   ./launch.sh  - Start Proximity"
echo "   ./stop.sh    - Stop Proximity"
echo "   ./status.sh  - Show this status"
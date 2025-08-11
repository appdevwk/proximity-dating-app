#!/bin/bash

# Proximity Stop Script
echo "🛑 Stopping Proximity services..."

# Kill all related processes
pkill -f "node\|tsx\|cloudflared" || true

# Wait for processes to stop
sleep 3

# Check if any processes are still running
if pgrep -f "node\|tsx\|cloudflared" > /dev/null; then
    echo "⚠️  Force killing remaining processes..."
    pkill -9 -f "node\|tsx\|cloudflared" || true
fi

echo "✅ All services stopped successfully"
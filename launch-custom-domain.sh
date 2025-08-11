#!/bin/bash

# PROXIMITY Dating App - Custom Domain Launcher
# This script launches the app with custom domain proximitydatingapp.cloudflareaccess.com

set -e

echo "🚀 Launching PROXIMITY Dating App with custom domain..."
echo "Domain: proximitydatingapp.cloudflareaccess.com"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    pkill -f "tsx server.ts" || true
    pkill -f "cloudflared tunnel run" || true
    pkill -f "npm run dev" || true
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if Next.js server is running
if ! pgrep -f "tsx server.ts" > /dev/null; then
    echo "🔧 Starting Next.js server..."
    npm run dev > server.log 2>&1 &
    NEXT_PID=$!
    echo "✅ Next.js server started (PID: $NEXT_PID)"
    
    # Wait for server to be ready
    echo "⏳ Waiting for server to be ready..."
    sleep 10
    
    # Check if server is responding
    if curl -s http://localhost:3001 > /dev/null; then
        echo "✅ Server is responding on http://localhost:3001"
    else
        echo "❌ Server failed to start. Check server.log for details."
        cat server.log
        exit 1
    fi
else
    echo "✅ Next.js server is already running"
fi

# Check if custom domain tunnel is configured
if [ ! -f "~/.cloudflared/config.yml" ]; then
    echo "❌ Custom domain tunnel not configured."
    echo "Please run: ./setup-custom-domain.sh"
    exit 1
fi

# Get tunnel name from config
TUNNEL_NAME=$(grep "tunnel:" ~/.cloudflared/config.yml | cut -d' ' -f2)

if [ -z "$TUNNEL_NAME" ]; then
    echo "❌ Could not find tunnel name in configuration."
    exit 1
fi

# Stop any existing cloudflared processes
echo "🛑 Stopping existing Cloudflare processes..."
pkill -f cloudflared || true
sleep 3

# Start Cloudflare tunnel with custom domain
echo "🌐 Starting Cloudflare tunnel for custom domain..."
cloudflared tunnel run $TUNNEL_NAME > cloudflared-custom.log 2>&1 &
CLOUDFLARE_PID=$!
echo "✅ Cloudflare tunnel started (PID: $CLOUDFLARE_PID)"

# Wait for tunnel to be ready
echo "⏳ Waiting for tunnel to be ready..."
sleep 10

# Check if tunnel is running
if pgrep -f "cloudflared tunnel run" > /dev/null; then
    echo "✅ Cloudflare tunnel is running"
    echo ""
    echo "🌐 Your PROXIMITY Dating App is now available at:"
    echo "   https://proximitydatingapp.cloudflareaccess.com"
    echo ""
    echo "📋 Tunnel Information:"
    echo "   Name: $TUNNEL_NAME"
    echo "   Domain: proximitydatingapp.cloudflareaccess.com"
    echo ""
    echo "📝 Logs:"
    echo "   Server: server.log"
    echo "   Cloudflare: cloudflared-custom.log"
    echo ""
    echo "Press Ctrl+C to stop all services"
else
    echo "❌ Cloudflare tunnel failed to start. Check cloudflared-custom.log for details."
    cat cloudflared-custom.log
    exit 1
fi

# Keep the script running
while true; do
    sleep 30
    
    # Check if services are still running
    if ! pgrep -f "tsx server.ts" > /dev/null; then
        echo "❌ Next.js server stopped unexpectedly"
        break
    fi
    
    if ! pgrep -f "cloudflared tunnel run" > /dev/null; then
        echo "❌ Cloudflare tunnel stopped unexpectedly"
        break
    fi
done

cleanup
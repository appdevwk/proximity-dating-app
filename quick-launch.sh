#!/bin/bash

# Proximity Quick Launch - One Click Setup
echo "🚀 Proximity One-Click Quick Launch"
echo "====================================="

# Function to print colored output
print_status() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project directory."
    exit 1
fi

print_status "Setting up Proximity..."

# Kill existing processes
print_status "Cleaning up existing processes..."
pkill -f "node\|tsx\|cloudflared" || true
sleep 2

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing Node.js dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
fi

# Setup Cloudflared if needed
if [ ! -f "./usr/bin/cloudflared" ]; then
    print_status "Setting up Cloudflared..."
    
    # Create directories
    mkdir -p ./usr/bin
    
    # Download Cloudflared
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
    
    # Extract
    ar x cloudflared.deb
    tar xf data.tar.gz
    
    # Make executable
    chmod +x ./usr/bin/cloudflared
    
    # Clean up
    rm -f cloudflared.deb debian-binary control.tar.gz data.tar.gz
    
    print_success "Cloudflared setup complete"
fi

# Start Next.js server
print_status "Starting Next.js server..."
npm run dev > nextjs.log 2>&1 &
NEXTJS_PID=$!

# Wait for Next.js to start
print_status "Waiting for Next.js to start..."
for i in {1..15}; do
    if python3 -c "
import socket
import sys
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(2)
    result = s.connect_ex(('127.0.0.1', 3001))
    if result == 0:
        print('READY')
    else:
        print('WAITING')
    s.close()
except:
    print('ERROR')
" 2>/dev/null | grep -q "READY"; then
        break
    fi
    sleep 2
done

# Check if Next.js started
if python3 -c "
import socket
import sys
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(2)
    result = s.connect_ex(('127.0.0.1', 3001))
    if result == 0:
        print('RUNNING')
    else:
        print('FAILED')
    s.close()
except:
    print('ERROR')
" 2>/dev/null | grep -q "RUNNING"; then
    print_success "Next.js server started successfully"
else
    print_error "Failed to start Next.js server"
    print_error "Check nextjs.log for errors"
    exit 1
fi

# Start Cloudflare tunnel
print_status "Starting Cloudflare tunnel..."
nohup ./usr/bin/cloudflared tunnel --url http://localhost:3001 > cloudflared.log 2>&1 &
CLOUDFLARED_PID=$!

# Wait for tunnel URL
print_status "Waiting for tunnel URL..."
sleep 8

# Get tunnel URL
TUNNEL_URL=$(grep -o "https://[a-z-]*\.trycloudflare\.com" cloudflared.log | head -1)

print_success "Proximity launched successfully!"
echo ""
echo "🎉 YOUR PROXIMITY DATING APP IS NOW LIVE!"
echo "========================================="
echo ""
echo "📱 Access URLs:"
echo "   Local: http://localhost:3001"
if [ -n "$TUNNEL_URL" ]; then
    echo "   Public: $TUNNEL_URL"
    echo ""
    echo "🌍 Share this public URL with others!"
else
    echo "   Public: Starting... (check cloudflared.log)"
fi
echo ""
echo "📊 Service Status:"
echo "   Next.js PID: $NEXTJS_PID"
echo "   Cloudflare PID: $CLOUDFLARED_PID"
echo ""
echo "🛑 To stop: pkill -f 'node\|cloudflared'"
echo "📊 To check status: curl -I http://localhost:3001"
echo ""
echo "📋 Log Files:"
echo "   Next.js: tail -f nextjs.log"
echo "   Cloudflare: tail -f cloudflared.log"
echo ""
echo "✨ Enjoy your Proximity dating platform!"
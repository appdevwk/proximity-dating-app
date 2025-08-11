#!/bin/bash

# Proximity One-Click Install & Run Script
# This script will install everything and launch Proximity automatically

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "████████████████████████████████████████████████████████"
echo "█                                                      █"
echo "█           PROXIMITY ONE-CLICK INSTALLER             █"
echo "█                                                      █"
echo "█    🚀 Dating Platform - Quick Setup & Launch         █"
echo "█                                                      █"
echo "████████████████████████████████████████████████████████"
echo -e "${NC}"

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "Please don't run this script as root"
   exit 1
fi

# Check if in correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project directory."
    exit 1
fi

print_status "Starting Proximity one-click installation..."

# Update system
print_status "Updating system packages..."
if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -qq
    sudo apt-get upgrade -y -qq
elif command -v yum >/dev/null 2>&1; then
    sudo yum update -y -qq
elif command -v dnf >/dev/null 2>&1; then
    sudo dnf update -y -qq
fi

# Install Node.js if needed
if ! command -v node >/dev/null 2>&1; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Verify Node.js
NODE_VERSION=$(node --version 2>/dev/null || echo "not installed")
if [ "$NODE_VERSION" != "not installed" ]; then
    print_success "Node.js $NODE_VERSION installed"
else
    print_error "Node.js installation failed"
    exit 1
fi

# Install npm if needed
if ! command -v npm >/dev/null 2>&1; then
    print_status "Installing npm..."
    sudo apt-get install -y npm
fi

NPM_VERSION=$(npm --version 2>/dev/null || echo "not installed")
if [ "$NPM_VERSION" != "not installed" ]; then
    print_success "npm $NPM_VERSION installed"
else
    print_error "npm installation failed"
    exit 1
fi

# Install Python3 if needed
if ! command -v python3 >/dev/null 2>&1; then
    print_status "Installing Python3..."
    sudo apt-get install -y python3
fi

PYTHON_VERSION=$(python3 --version 2>/dev/null || echo "not installed")
if [ "$PYTHON_VERSION" != "not installed" ]; then
    print_success "Python $PYTHON_VERSION installed"
else
    print_error "Python3 installation failed"
    exit 1
fi

# Install curl if needed
if ! command -v curl >/dev/null 2>&1; then
    print_status "Installing curl..."
    sudo apt-get install -y curl
fi

print_success "All dependencies installed successfully"

# Install Node.js project dependencies
print_status "Installing Node.js project dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_success "Project dependencies installed successfully"
else
    print_error "Failed to install project dependencies"
    exit 1
fi

# Setup database if using Prisma
if [ -f "prisma/schema.prisma" ]; then
    print_status "Setting up database..."
    npm run db:push || print_warning "Database setup failed, continuing anyway..."
    npm run db:generate || print_warning "Database generation failed, continuing anyway..."
fi

# Setup Cloudflared
print_status "Setting up Cloudflared..."
mkdir -p ./usr/bin

if [ ! -f "./usr/bin/cloudflared" ]; then
    print_status "Downloading Cloudflared..."
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
    
    if [ -f "cloudflared.deb" ]; then
        print_status "Extracting Cloudflared..."
        ar x cloudflared.deb
        tar xf data.tar.gz
        chmod +x ./usr/bin/cloudflared
        
        # Clean up
        rm -f cloudflared.deb debian-binary control.tar.gz data.tar.gz
        
        print_success "Cloudflared setup completed"
    else
        print_error "Failed to download Cloudflared"
        exit 1
    fi
else
    print_success "Cloudflared already setup"
fi

# Kill existing processes
print_status "Cleaning up existing processes..."
pkill -f "node\|tsx\|cloudflared" || true
sleep 3

# Start Next.js server
print_status "Starting Next.js development server..."
npm run dev > nextjs.log 2>&1 &
NEXTJS_PID=$!

# Wait for Next.js to start
print_status "Waiting for Next.js server to start..."
for i in {1..20}; do
    if python3 -c "
import socket
import sys
import time

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
    echo -n "."
done
echo ""

# Check if Next.js is running
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
print_status "Waiting for Cloudflare tunnel URL..."
sleep 10

# Extract tunnel URL
TUNNEL_URL=$(grep -o "https://[a-z-]*\.trycloudflare\.com" cloudflared.log | head -1)

print_success "🎉 PROXIMITY INSTALLATION & LAUNCH COMPLETE!"
echo ""
echo -e "${GREEN}████████████████████████████████████████████████████████"
echo "█                                                      █"
echo "█           YOUR PROXIMITY DATING APP IS LIVE!          █"
echo "█                                                      █"
echo "████████████████████████████████████████████████████████${NC}"
echo ""
echo "📱 ACCESS YOUR APPLICATION:"
echo "   Local:     http://localhost:3001"
if [ -n "$TUNNEL_URL" ]; then
    echo "   Public:    $TUNNEL_URL"
    echo ""
    echo "🌍 SHARE THIS PUBLIC URL WITH OTHERS!"
else
    echo "   Public:    Starting... (check cloudflared.log)"
fi
echo ""
echo "📊 SERVICE STATUS:"
echo "   Next.js Server:   RUNNING (PID: $NEXTJS_PID)"
echo "   Cloudflare Tunnel: RUNNING (PID: $CLOUDFLARED_PID)"
echo ""
echo "🛑 TO STOP SERVICES:"
echo "   pkill -f 'node\|cloudflared'"
echo ""
echo "📊 CHECK STATUS:"
echo "   curl -I http://localhost:3001"
echo ""
echo "📋 VIEW LOGS:"
echo "   Next.js:     tail -f nextjs.log"
echo "   Cloudflare:  tail -f cloudflared.log"
echo ""
echo "🔧 QUICK COMMANDS:"
echo "   ./status.sh    - Check service status"
echo "   ./stop.sh      - Stop all services"
echo "   ./launch.sh    - Relaunch services"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT NOTES:${NC}"
echo "   • The tunnel URL may change if you restart services"
echo "   • Keep this terminal open to keep services running"
echo "   • Press Ctrl+C to stop all services"
echo ""
echo -e "${GREEN}✨ ENJOY YOUR PROXIMITY DATING PLATFORM!${NC}"

# Keep script running
echo ""
echo "Press Ctrl+C to stop all services..."
trap 'echo ""; echo "🛑 Stopping services..."; kill $NEXTJS_PID $CLOUDFLARED_PID 2>/dev/null; pkill -f "node\|cloudflared"; echo "✅ All services stopped"; exit 0' INT

# Wait indefinitely
while true; do
    sleep 1
done
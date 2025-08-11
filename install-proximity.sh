#!/bin/bash

# Proximity One-Click Installation Script
# This script installs and launches the Proximity dating application with Cloudflare tunnel

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing system dependencies..."
    
    # Update package list
    if command_exists apt-get; then
        sudo apt-get update
        sudo apt-get install -y curl wget python3 nodejs npm
    elif command_exists yum; then
        sudo yum update -y
        sudo yum install -y curl wget python3 nodejs npm
    elif command_exists dnf; then
        sudo dnf update -y
        sudo dnf install -y curl wget python3 nodejs npm
    else
        print_error "No supported package manager found. Please install Node.js, npm, curl, and python3 manually."
        exit 1
    fi
    
    print_success "System dependencies installed successfully"
}

# Function to setup Node.js
setup_nodejs() {
    print_status "Setting up Node.js..."
    
    if ! command_exists node; then
        print_status "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Verify Node.js installation
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION installed successfully"
}

# Function to download and setup Cloudflared
setup_cloudflared() {
    print_status "Setting up Cloudflared..."
    
    if [ ! -f "./usr/bin/cloudflared" ]; then
        print_status "Downloading Cloudflared..."
        curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
        
        print_status "Extracting Cloudflared..."
        ar x cloudflared.deb
        tar xf data.tar.gz
        
        print_status "Making Cloudflared executable..."
        chmod +x ./usr/bin/cloudflared
        
        # Clean up
        rm -f cloudflared.deb debian-binary control.tar.gz data.tar.gz
    fi
    
    print_success "Cloudflared setup completed"
}

# Function to install Proximity
install_proximity() {
    print_status "Installing Proximity..."
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please ensure you're in the correct directory."
        exit 1
    fi
    
    # Install Node.js dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Setup database if using Prisma
    if [ -f "prisma/schema.prisma" ]; then
        print_status "Setting up database..."
        npm run db:push
        npm run db:generate
    fi
    
    print_success "Proximity installation completed"
}

# Function to start services
start_services() {
    print_status "Starting Proximity services..."
    
    # Kill any existing processes
    pkill -f "node\|tsx\|cloudflared" || true
    
    # Start Next.js server
    print_status "Starting Next.js server..."
    nohup npm run dev > nextjs.log 2>&1 &
    
    # Wait for Next.js to start
    print_status "Waiting for Next.js to start..."
    sleep 10
    
    # Check if Next.js is running
    if python3 -c "
import socket
import sys
import time

for i in range(10):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(5)
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
        print_success "Next.js server started successfully"
    else
        print_error "Failed to start Next.js server"
        exit 1
    fi
    
    # Start Cloudflare tunnel
    print_status "Starting Cloudflare tunnel..."
    nohup ./usr/bin/cloudflared tunnel --url http://localhost:3001 > cloudflared.log 2>&1 &
    
    # Wait for Cloudflare to start
    sleep 5
    
    # Extract URL from logs
    TUNNEL_URL=$(grep -o "https://[a-z-]*\.trycloudflare\.com" cloudflared.log | head -1)
    
    if [ -n "$TUNNEL_URL" ]; then
        print_success "Cloudflare tunnel started successfully"
        print_success "Your Proximity application is accessible at: $TUNNEL_URL"
    else
        print_warning "Cloudflare tunnel started but URL not yet available"
        print_warning "Please check cloudflared.log for the URL"
    fi
}

# Function to display status
show_status() {
    print_status "Checking service status..."
    
    # Check Next.js
    if pgrep -f "node\|tsx" > /dev/null; then
        print_success "Next.js server is running"
    else
        print_error "Next.js server is not running"
    fi
    
    # Check Cloudflare
    if pgrep -f "cloudflared" > /dev/null; then
        print_success "Cloudflare tunnel is running"
        TUNNEL_URL=$(grep -o "https://[a-z-]*\.trycloudflare\.com" cloudflared.log | head -1)
        if [ -n "$TUNNEL_URL" ]; then
            print_success "Public URL: $TUNNEL_URL"
        fi
    else
        print_error "Cloudflare tunnel is not running"
    fi
}

# Function to stop services
stop_services() {
    print_status "Stopping Proximity services..."
    pkill -f "node\|tsx\|cloudflared" || true
    print_success "All services stopped"
}

# Function to show help
show_help() {
    echo "Proximity One-Click Installation Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  install     Install Proximity and all dependencies"
    echo "  start       Start Proximity services"
    echo "  stop        Stop Proximity services"
    echo "  restart     Restart Proximity services"
    echo "  status      Show service status"
    echo "  update      Update Proximity to latest version"
    echo "  logs        Show service logs"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 install     # Full installation"
    echo "  $0 start       # Start services"
    echo "  $0 status      # Check status"
}

# Function to show logs
show_logs() {
    echo "=== Next.js Logs ==="
    if [ -f "nextjs.log" ]; then
        tail -20 nextjs.log
    else
        echo "No Next.js logs found"
    fi
    
    echo ""
    echo "=== Cloudflare Logs ==="
    if [ -f "cloudflared.log" ]; then
        tail -20 cloudflared.log
    else
        echo "No Cloudflare logs found"
    fi
}

# Function to update Proximity
update_proximity() {
    print_status "Updating Proximity..."
    
    # Pull latest changes if git repository
    if [ -d ".git" ]; then
        git pull origin main || git pull origin master
    fi
    
    # Update dependencies
    npm install
    
    # Restart services
    stop_services
    start_services
    
    print_success "Proximity updated successfully"
}

# Main script logic
case "${1:-install}" in
    install)
        echo "🚀 Starting Proximity One-Click Installation..."
        echo "=============================================="
        
        install_dependencies
        setup_nodejs
        setup_cloudflared
        install_proximity
        start_services
        
        echo ""
        echo "🎉 Proximity Installation Complete!"
        echo "=============================================="
        show_status
        echo ""
        echo "📝 Useful Commands:"
        echo "  $0 start     - Start services"
        echo "  $0 stop      - Stop services"
        echo "  $0 status    - Check status"
        echo "  $0 logs      - View logs"
        echo ""
        ;;
    start)
        start_services
        show_status
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        start_services
        show_status
        ;;
    status)
        show_status
        ;;
    update)
        update_proximity
        ;;
    logs)
        show_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
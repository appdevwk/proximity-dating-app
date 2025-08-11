#!/bin/bash

# PROXIMITY Dating App - Complete Custom Domain Setup
# One-click setup for proximitydatingapp.cloudflareaccess.com

set -e

echo "🚀 PROXIMITY Dating App - Custom Domain Setup"
echo "=============================================="
echo "Setting up custom domain: proximitydatingapp.cloudflareaccess.com"
echo ""

# Function to check if user is authenticated
check_authentication() {
    echo "🔍 Checking Cloudflare authentication..."
    if cloudflared tunnel list 2>/dev/null | grep -q "tunnel"; then
        echo "✅ Already authenticated with Cloudflare"
        return 0
    else
        echo "❌ Not authenticated with Cloudflare"
        return 1
    fi
}

# Function to authenticate user
authenticate_user() {
    echo ""
    echo "🔐 Cloudflare Authentication Required"
    echo "====================================="
    echo "To set up your custom domain, you need to authenticate with Cloudflare."
    echo ""
    echo "Please follow these steps:"
    echo "1. A browser window will open with a Cloudflare login page"
    echo "2. Log in to your Cloudflare account"
    echo "3. Select the domain you want to use for your app"
    echo "4. Complete the authentication process"
    echo ""
    read -p "Press Enter to continue with authentication..."
    
    cloudflared tunnel login
    
    if check_authentication; then
        echo "✅ Authentication successful!"
        return 0
    else
        echo "❌ Authentication failed. Please try again."
        return 1
    fi
}

# Function to setup tunnel
setup_tunnel() {
    echo ""
    echo "🌐 Setting up Cloudflare Tunnel"
    echo "==============================="
    
    # Create config directory
    mkdir -p ~/.cloudflared
    
    # Generate unique tunnel name
    TUNNEL_NAME="proximity-dating-app-$(date +%s)"
    echo "Creating tunnel: $TUNNEL_NAME"
    
    # Create tunnel
    TUNNEL_UUID=$(cloudflared tunnel create $TUNNEL_NAME 2>/dev/null | grep -o '[a-f0-9-]\{36\}' || true)
    
    if [ -z "$TUNNEL_UUID" ]; then
        echo "❌ Failed to create tunnel. Please check your Cloudflare account."
        return 1
    fi
    
    echo "✅ Tunnel created: $TUNNEL_UUID"
    
    # Update configuration
    sed -i "s/<YOUR_TUNNEL_ID>/$TUNNEL_UUID/g" cloudflared.yml
    
    # Create DNS record
    echo "🌍 Creating DNS record..."
    cloudflared tunnel route dns $TUNNEL_NAME proximitydatingapp.cloudflareaccess.com
    
    # Copy configuration
    cp cloudflared.yml ~/.cloudflared/config.yml
    
    echo "✅ Tunnel setup completed!"
    echo "Tunnel name: $TUNNEL_NAME"
    echo "Tunnel UUID: $TUNNEL_UUID"
    
    return 0
}

# Function to start services
start_services() {
    echo ""
    echo "🚀 Starting Services"
    echo "===================="
    
    # Check if Next.js is running
    if ! pgrep -f "tsx server.ts" > /dev/null; then
        echo "🔧 Starting Next.js server..."
        npm run dev > server.log 2>&1 &
        echo "✅ Next.js server started"
        sleep 10
    else
        echo "✅ Next.js server already running"
    fi
    
    # Get tunnel name
    TUNNEL_NAME=$(grep "tunnel:" ~/.cloudflared/config.yml | cut -d' ' -f2)
    
    if [ -z "$TUNNEL_NAME" ]; then
        echo "❌ Could not find tunnel configuration"
        return 1
    fi
    
    # Stop existing tunnel
    pkill -f "cloudflared tunnel run" || true
    sleep 3
    
    # Start tunnel
    echo "🌐 Starting Cloudflare tunnel..."
    cloudflared tunnel run $TUNNEL_NAME > cloudflared-custom.log 2>&1 &
    echo "✅ Cloudflare tunnel started"
    sleep 10
    
    # Verify services
    if pgrep -f "tsx server.ts" > /dev/null && pgrep -f "cloudflared tunnel run" > /dev/null; then
        echo "✅ All services running successfully!"
        return 0
    else
        echo "❌ Some services failed to start"
        return 1
    fi
}

# Main execution
main() {
    echo "Starting PROXIMITY custom domain setup..."
    echo ""
    
    # Check authentication
    if ! check_authentication; then
        if ! authenticate_user; then
            echo "❌ Setup failed: Authentication error"
            exit 1
        fi
    fi
    
    # Setup tunnel
    if ! setup_tunnel; then
        echo "❌ Setup failed: Tunnel creation error"
        exit 1
    fi
    
    # Start services
    if ! start_services; then
        echo "❌ Setup failed: Service startup error"
        exit 1
    fi
    
    # Success
    echo ""
    echo "🎉 Setup Complete!"
    echo "================="
    echo ""
    echo "🌐 Your PROXIMITY Dating App is now available at:"
    echo "   https://proximitydatingapp.cloudflareaccess.com"
    echo ""
    echo "📋 Management Commands:"
    echo "   Stop services: ./stop.sh"
    echo "   Check status: ./status.sh"
    echo "   View logs: tail -f server.log or tail -f cloudflared-custom.log"
    echo ""
    echo "⚠️  Note: It may take a few minutes for DNS to propagate"
    echo "   If you can't access the site immediately, please wait and try again"
    echo ""
    echo "🔧 For troubleshooting, check the log files in /home/z/my-project/"
}

# Run main function
main "$@"
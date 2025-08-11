#!/bin/bash

# PROXIMITY Dating App - Custom Domain Setup Script
# This script sets up Cloudflare tunnel with custom domain proximitydatingapp.cloudflareaccess.com

set -e

echo "🚀 Setting up PROXIMITY Dating App with custom domain..."
echo "Domain: proximitydatingapp.cloudflareaccess.com"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ Cloudflared is not installed. Please run the main installation script first."
    exit 1
fi

# Check if user is logged in to Cloudflare
echo "🔍 Checking Cloudflare authentication..."
if ! cloudflared tunnel list &> /dev/null; then
    echo "❌ You need to login to Cloudflare first."
    echo "Please run: cloudflared tunnel login"
    echo "Then follow the instructions to authenticate with your Cloudflare account."
    exit 1
fi

# Create tunnel configuration directory
echo "📁 Creating configuration directory..."
mkdir -p ~/.cloudflared

# Generate a unique tunnel name
TUNNEL_NAME="proximity-dating-app-$(date +%s)"
echo "🔧 Creating tunnel: $TUNNEL_NAME"

# Create the tunnel
echo "🌐 Creating Cloudflare tunnel..."
TUNNEL_UUID=$(cloudflared tunnel create $TUNNEL_NAME | grep -o '[a-f0-9-]\{36\}')

if [ -z "$TUNNEL_UUID" ]; then
    echo "❌ Failed to create tunnel. Please check your Cloudflare account and try again."
    exit 1
fi

echo "✅ Tunnel created with UUID: $TUNNEL_UUID"

# Update the configuration file with the tunnel UUID
echo "⚙️ Updating configuration..."
sed -i "s/<YOUR_TUNNEL_ID>/$TUNNEL_UUID/g" cloudflared.yml

# Create DNS record
echo "🌍 Creating DNS record..."
cloudflared tunnel route dns $TUNNEL_NAME proximitydatingapp.cloudflareaccess.com

# Copy configuration to ~/.cloudflared/
cp cloudflared.yml ~/.cloudflared/config.yml

echo "✅ Configuration completed!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure your domain proximitydatingapp.cloudflareaccess.com is pointed to Cloudflare"
echo "2. Wait for DNS propagation (may take a few minutes)"
echo "3. Start the tunnel with: cloudflared tunnel run $TUNNEL_NAME"
echo ""
echo "🌐 Your app will be available at: https://proximitydatingapp.cloudflareaccess.com"
echo ""
echo "📝 Tunnel details:"
echo "  Name: $TUNNEL_NAME"
echo "  UUID: $TUNNEL_UUID"
echo "  Domain: proximitydatingapp.cloudflareaccess.com"
echo ""

# Ask if user wants to start the tunnel now
read -p "Do you want to start the tunnel now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting tunnel..."
    # Stop any existing tunnel
    pkill -f cloudflared || true
    sleep 2
    
    # Start the new tunnel
    cloudflared tunnel run $TUNNEL_NAME &
    
    echo "✅ Tunnel started in background"
    echo "🌐 Check your domain: https://proximitydatingapp.cloudflareaccess.com"
fi

echo ""
echo "🎉 Custom domain setup complete!"
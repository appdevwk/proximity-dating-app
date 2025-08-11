#!/bin/bash

# PROXIMITY Dating App - Cloudflare Authentication Script
# This script helps you authenticate with Cloudflare for custom domain setup

echo "🔐 PROXIMITY Dating App - Cloudflare Authentication"
echo "=================================================="
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ Cloudflared is not installed."
    echo "Please run the main installation script first."
    exit 1
fi

echo "📋 To set up your custom domain 'proximitydatingapp.cloudflareaccess.com',"
echo "you need to authenticate with Cloudflare first."
echo ""

echo "🔧 Starting Cloudflare authentication process..."
echo ""

# Run the login command
echo "1. Running: cloudflared tunnel login"
echo "2. A URL will be displayed below"
echo "3. Open the URL in your browser"
echo "4. Log in to your Cloudflare account"
echo "5. Select the domain you want to use"
echo "6. Complete the authentication"
echo ""
echo "Starting authentication..."
echo ""

cloudflared tunnel login

echo ""
echo "✅ Authentication process completed!"
echo ""
echo "📋 Next steps:"
echo "1. Run: ./setup-custom-domain.sh"
echo "2. Follow the prompts to create your tunnel"
echo "3. Run: ./launch-custom-domain.sh to start your app"
echo ""
echo "🌐 Your app will be available at: https://proximitydatingapp.cloudflareaccess.com"
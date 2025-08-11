#!/bin/bash

# Simple Copy and Organization Script for Proximity
# Since files are already in /home/z/my-project, this script organizes and prepares them

echo "🚀 Proximity Files Organization Script"
echo "======================================="

TARGET_DIR="/home/z/my-project"

echo "📍 Target Directory: $TARGET_DIR"
echo ""

# Check if we're in the right directory
if [ "$(pwd)" != "$TARGET_DIR" ]; then
    echo "📁 Changing to target directory..."
    cd "$TARGET_DIR"
fi

echo "📋 Verifying key files..."

# Check essential files
ESSENTIAL_FILES=(
    "package.json"
    "server.ts" 
    "INSTALL-RUN-NOW.sh"
    "launch.sh"
    "usr/bin/cloudflared"
)

for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$TARGET_DIR/$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
    fi
done

echo ""
echo "🔧 Setting up permissions..."

# Make scripts executable
chmod +x INSTALL-RUN-NOW.sh 2>/dev/null || echo "⚠️  INSTALL-RUN-NOW.sh permission issue"
chmod +x launch.sh 2>/dev/null || echo "⚠️  launch.sh permission issue"  
chmod +x stop.sh 2>/dev/null || echo "⚠️  stop.sh permission issue"
chmod +x status.sh 2>/dev/null || echo "⚠️  status.sh permission issue"
chmod +x quick-launch.sh 2>/dev/null || echo "⚠️  quick-launch.sh permission issue"

# Make cloudflared executable
chmod +x usr/bin/cloudflared 2>/dev/null || echo "⚠️  cloudflared permission issue"

echo ""
echo "📊 Project Status:"

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed (node_modules exists)"
else
    echo "⚠️  Dependencies not installed (node_modules missing)"
fi

# Check if Next.js can run
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js available: $(node --version)"
else
    echo "❌ Node.js not available"
fi

if command -v npm >/dev/null 2>&1; then
    echo "✅ npm available: $(npm --version)"
else
    echo "❌ npm not available"
fi

echo ""
echo "🎯 READY TO LAUNCH COMMANDS:"
echo ""
echo "🚀 ONE-CLICK INSTALL & LAUNCH:"
echo "   bash INSTALL-RUN-NOW.sh"
echo ""
echo "⚡ QUICK LAUNCH (if dependencies installed):"
echo "   ./launch.sh"
echo ""
echo "📊 CHECK STATUS:"
echo "   ./status.sh"
echo ""
echo "🛑 STOP SERVICES:"
echo "   ./stop.sh"
echo ""
echo "📋 VIEW AVAILABLE SCRIPTS:"
echo "   ls -la *.sh"
echo ""
echo "🌐 ACCESS URLS AFTER LAUNCH:"
echo "   Local: http://localhost:3001"
echo "   Public: https://[random-words].trycloudflare.com"
echo ""
echo "✨ Proximity files are ready in $TARGET_DIR!"
echo "🎉 Run 'bash INSTALL-RUN-NOW.sh' to launch your dating platform!"
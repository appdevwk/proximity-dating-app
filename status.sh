#!/bin/bash
echo "📊 Proximity Dating App Status"
echo "============================"

if pgrep -f "tsx server.ts" > /dev/null; then
    echo "✅ Server is running"
    echo "   Process: $(pgrep -f 'tsx server.ts')"
    echo "   Port: 3001"
    echo ""
    echo "🌐 Access URLs:"
    echo "   http://localhost:3001"
    echo "   http://127.0.0.1:3001"
    echo "   http://0.0.0.0:3001"
else
    echo "❌ Server is not running"
    echo "   Start with: bash start-dev.sh"
fi

echo ""
echo "📁 Project Structure:"
echo "   Source files: $(find src -name '*.tsx' -o -name '*.ts' 2>/dev/null | wc -l) files"
echo "   Components: $(find src/components -name '*.tsx' 2>/dev/null | wc -l) files"
echo "   API routes: $(find src/app/api -name '*.ts' 2>/dev/null | wc -l) files"

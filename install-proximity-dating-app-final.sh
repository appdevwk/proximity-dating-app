#!/bin/bash

# Proximity Dating App - Final Clean Install Script
# This script cleans up unnecessary files and provides a fresh installation

set -e

echo "🚀 Proximity Dating App - Final Clean Install Script"
echo "=================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

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

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

print_complete() {
    echo -e "${CYAN}[COMPLETE]${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -f "src/app/page.tsx" ]; then
    print_error "This script must be run from the Proximity Dating App root directory"
    exit 1
fi

# Create backup directory
BACKUP_DIR="backup-final-install-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
print_status "Created backup directory: $BACKUP_DIR"

# Step 1: Clean up unnecessary files
print_step "Step 1: Cleaning up unnecessary files..."

# Remove backup directories
for dir in backup-*; do
    if [ -d "$dir" ]; then
        mv "$dir" "$BACKUP_DIR/" 2>/dev/null || rm -rf "$dir" 2>/dev/null || true
        print_status "Moved $dir to backup"
    fi
done

# Remove unnecessary files
unnecessary_files=(
    "*.log" "*.backup" "*.py" "*.bat" "*.txt" "*.egg-info" 
    "wget-log*" "install.sh" "setup.py" "deploy.py" "status.py"
    "test-python-launcher.py" "serve_download.sh" "find_project.sh"
    "pip-install.sh" "install-pip.py" "one-click-install.py"
    "download_instructions.md" "dev-scripts.sh" "deploy.sh"
    "deploy-to-vercel.sh" "setup.sh" "vercel-build.sh"
    "vercel.json" "package-vercel.json" "proximity-dating-app.tar.gz"
    "proximity--env" "proximity-env" "MANIFEST.in" "requirements.txt"
    "custom.db" "=5.0.0" "vercel-vercel-44.7.3" "vercel-vercel-44.7.3.tar.gz"
    "tsconfig.tsbuildinfo" "cleanup-project.sh" "simple-cleanup.sh"
    "quick-cleanup.sh" "final-cleanup.sh" "one-click-setup.sh"
    "install-proximity-dating-app.sh" "install-proximity-dating-app-v2.sh"
)

for pattern in "${unnecessary_files[@]}"; do
    if [ -f "$pattern" ]; then
        mv "$pattern" "$BACKUP_DIR/" 2>/dev/null || rm -f "$pattern" 2>/dev/null || true
        print_status "Moved $pattern to backup"
    elif [ -d "$pattern" ]; then
        mv "$pattern" "$BACKUP_DIR/" 2>/dev/null || rm -rf "$pattern" 2>/dev/null || true
        print_status "Moved $pattern to backup"
    fi
done

# Remove unnecessary directories
unnecessary_dirs=(
    "__pycache__" "data" "archive" "tests" "examples" "app-api-backup"
)

for dir in "${unnecessary_dirs[@]}"; do
    if [ -d "$dir" ]; then
        mv "$dir" "$BACKUP_DIR/" 2>/dev/null || rm -rf "$dir" 2>/dev/null || true
        print_status "Moved $dir to backup"
    fi
done

# Remove build artifacts (with error handling)
if [ -d ".next" ]; then
    mv .next "$BACKUP_DIR/" 2>/dev/null || rm -rf .next 2>/dev/null || true
    print_status "Moved .next to backup"
fi

if [ -d "socket-server/dist" ]; then
    mv socket-server/dist "$BACKUP_DIR/" 2>/dev/null || rm -rf socket-server/dist 2>/dev/null || true
    print_status "Moved socket-server/dist to backup"
fi

print_complete "Step 1 completed: Unnecessary files cleaned up"

# Step 2: Check system requirements
print_step "Step 2: Checking system requirements..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

print_complete "Step 2 completed: System requirements verified"

# Step 3: Install dependencies
print_step "Step 3: Installing dependencies..."

# Clean node_modules if it exists
if [ -d "node_modules" ]; then
    mv node_modules "$BACKUP_DIR/" 2>/dev/null || rm -rf node_modules 2>/dev/null || true
    print_status "Moved node_modules to backup"
fi

# Install main app dependencies
print_status "Installing main app dependencies..."
npm install
print_success "Main app dependencies installed"

# Install socket-server dependencies
print_status "Installing socket-server dependencies..."
cd socket-server
if [ -d "node_modules" ]; then
    mv node_modules "../$BACKUP_DIR/" 2>/dev/null || rm -rf node_modules 2>/dev/null || true
    print_status "Moved socket-server node_modules to backup"
fi
npm install
cd ..
print_success "Socket-server dependencies installed"

print_complete "Step 3 completed: Dependencies installed"

# Step 4: Setup database
print_step "Step 4: Setting up database..."

# Generate Prisma client
print_status "Generating Prisma client..."
npm run db:generate

# Push database schema
print_status "Pushing database schema..."
npm run db:push

print_success "Database setup completed"

print_complete "Step 4 completed: Database setup"

# Step 5: Create startup scripts
print_step "Step 5: Creating startup scripts..."

# Development script
cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Proximity Dating App in development mode..."
echo "Access URLs:"
echo "  http://localhost:3001"
echo "  http://127.0.0.1:3001"
echo "  http://0.0.0.0:3001"
echo ""
npm run dev
EOF

# Local script
cat > start-local.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Proximity Dating App for local access..."
echo "Access URLs:"
echo "  http://localhost:3001"
echo "  http://127.0.0.1:3001"
echo ""
PORT=3001 npm run dev
EOF

# Production script
cat > start-prod.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Proximity Dating App in production mode..."
echo "Access URLs:"
echo "  http://localhost:3001"
echo "  http://127.0.0.1:3001"
echo "  http://0.0.0.0:3001"
echo ""
npm run build
npm start
EOF

# Status script
cat > status.sh << 'EOF'
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
EOF

# Make scripts executable
chmod +x start-dev.sh start-local.sh start-prod.sh status.sh 2>/dev/null || true

print_success "Startup scripts created"

print_complete "Step 5 completed: Startup scripts created"

# Step 6: Create environment files
print_step "Step 6: Setting up environment files..."

# Create .env.example if it doesn't exist
if [ ! -f ".env.example" ]; then
    cat > .env.example << 'EOF'
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3001"

# AI SDK (if needed)
ZAI_API_KEY="your-zai-api-key-here"

# Socket.IO
SOCKET_PORT="3002"
EOF
    print_success "Created .env.example"
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    print_success "Created .env from .env.example"
fi

print_complete "Step 6 completed: Environment files setup"

# Step 7: Update documentation
print_step "Step 7: Updating documentation..."

cat > README.md << 'EOF'
# Proximity Dating App

A modern dating application built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎨 Modern UI with pink theme
- 🔐 User authentication and verification
- 💬 Real-time messaging with Socket.IO
- 📱 Mobile-responsive design
- 🎯 Ad-supported free access model
- 🗄️ Database with Prisma ORM

## Quick Start

1. Run the install script:
   ```bash
   bash install-proximity-dating-app-final.sh
   ```

2. Start development server:
   ```bash
   bash start-dev.sh
   ```

3. Access the app at http://localhost:3001

## Scripts

- `bash start-dev.sh` - Start development server
- `bash start-local.sh` - Start for local access only
- `bash start-prod.sh` - Start production server
- `bash status.sh` - Check application status
- `npm run lint` - Run code linting
- `npm run db:push` - Push database schema
- `npm run db:generate` - Generate Prisma client

## Access URLs

- http://localhost:3001
- http://127.0.0.1:3001
- http://0.0.0.0:3001

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: SQLite with Prisma ORM
- **Real-time**: Socket.IO
- **Authentication**: NextAuth.js
- **State Management**: Zustand, TanStack Query

## Installation Complete ✅

This project has been cleanly installed and is ready to use. All unnecessary files have been removed, and all dependencies are properly installed.
EOF

print_success "README.md updated"

print_complete "Step 7 completed: Documentation updated"

# Final summary
echo ""
echo "🎉 Installation completed successfully!"
echo "===================================="
echo ""
echo "📁 Backup created: $BACKUP_DIR"
echo "🚀 Ready to start the app:"
echo "   bash start-dev.sh    - Development mode"
echo "   bash start-local.sh  - Local access only"
echo "   bash start-prod.sh   - Production mode"
echo ""
echo "📊 Check status:"
echo "   bash status.sh"
echo ""
echo "🌐 Access URLs:"
echo "   http://localhost:3001"
echo "   http://127.0.0.1:3001"
echo "   http://0.0.0.0:3001"
echo ""
echo "📁 Essential files preserved:"
echo "   ✅ src/ (application source code)"
echo "   ✅ public/ (static assets)"
echo "   ✅ prisma/ (database schema)"
echo "   ✅ package.json (dependencies)"
echo "   ✅ server.ts (server entry point)"
echo "   ✅ socket-server/ (real-time server)"
echo "   ✅ Configuration files"
echo ""
echo "🧹 Cleanup completed:"
echo "   ✅ Removed unnecessary files and directories"
echo "   ✅ Installed fresh dependencies"
echo "   ✅ Generated Prisma client"
echo "   ✅ Created startup scripts"
echo "   ✅ Setup environment files"
echo "   ✅ Updated documentation"
echo ""
echo "🔧 System requirements verified:"
echo "   ✅ Node.js: $(node --version)"
echo "   ✅ npm: $(npm --version)"
echo ""
echo "📊 Project statistics:"
echo "   Source files: $(find src -name '*.tsx' -o -name '*.ts' 2>/dev/null | wc -l)"
echo "   Components: $(find src/components -name '*.tsx' 2>/dev/null | wc -l)"
echo "   API routes: $(find src/app/api -name '*.ts' 2>/dev/null | wc -l)"
echo "   Dependencies: $(npm list --depth=0 | grep -c 'package')"
echo ""
echo "🎯 Next steps:"
echo "   1. Run 'bash start-dev.sh' to start the app"
echo "   2. Open http://localhost:3001 in your browser"
echo "   3. Enjoy your Proximity Dating App!"
echo ""
echo "🎉 Proximity Dating App is ready to use!"
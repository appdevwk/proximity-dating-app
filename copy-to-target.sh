#!/bin/bash

# Proximity Files Copy Script
# This script copies all Proximity files to the target directory: /home/z/my-project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SOURCE_DIR="/home/z/my-project"
TARGET_DIR="/home/z/my-project"

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

echo -e "${BLUE}"
echo "████████████████████████████████████████████████████████"
echo "█                                                      █"
echo "█           PROXIMITY FILES COPY SCRIPT               █"
echo "█                                                      █"
echo "█    📁 Copy all files to target directory            █"
echo "█                                                      █"
echo "████████████████████████████████████████████████████████"
echo -e "${NC}"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    print_error "Source directory $SOURCE_DIR does not exist"
    exit 1
fi

# Check if target directory exists, create if not
if [ ! -d "$TARGET_DIR" ]; then
    print_status "Creating target directory: $TARGET_DIR"
    mkdir -p "$TARGET_DIR"
fi

print_status "Source directory: $SOURCE_DIR"
print_status "Target directory: $TARGET_DIR"

# List of files and directories to copy
FILES_TO_COPY=(
    "package.json"
    "package-lock.json"
    "next.config.ts"
    "tailwind.config.ts"
    "tsconfig.json"
    "server.ts"
    "prisma"
    "src"
    "public"
    "scripts"
    "components"
    "lib"
    "app"
    "pages"
    "styles"
    "types"
    "hooks"
    "utils"
    "contexts"
    "services"
    "middleware"
    "docs"
    "README.md"
    ".env.example"
    ".gitignore"
    ".eslintrc.json"
    ".prettierrc"
    "postcss.config.js"
    "tailwind.config.js"
)

# Scripts to copy
SCRIPTS_TO_COPY=(
    "install-proximity.sh"
    "launch.sh"
    "stop.sh"
    "status.sh"
    "launch-proximity.py"
    "quick-launch.sh"
    "INSTALL-RUN-NOW.sh"
    "PROXIMITY-QUICK-START.md"
    "QUICK-COMMANDS.txt"
    "copy-to-target.sh"
)

# Function to copy files if they exist
copy_file_if_exists() {
    local src="$1"
    local dest="$2"
    
    if [ -e "$src" ]; then
        if [ -f "$src" ]; then
            cp "$src" "$dest"
            print_success "Copied file: $src -> $dest"
        elif [ -d "$src" ]; then
            cp -r "$src" "$dest"
            print_success "Copied directory: $src -> $dest"
        fi
    else
        print_warning "File not found: $src"
    fi
}

# Create backup of target directory if it exists and has files
if [ -d "$TARGET_DIR" ] && [ "$(ls -A $TARGET_DIR)" ]; then
    print_status "Creating backup of existing target directory..."
    BACKUP_DIR="${TARGET_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
    cp -r "$TARGET_DIR" "$BACKUP_DIR"
    print_success "Backup created: $BACKUP_DIR"
fi

# Copy main project files
print_status "Copying main project files..."
for item in "${FILES_TO_COPY[@]}"; do
    copy_file_if_exists "$SOURCE_DIR/$item" "$TARGET_DIR/$item"
done

# Copy scripts
print_status "Copying scripts..."
for script in "${SCRIPTS_TO_COPY[@]}"; do
    copy_file_if_exists "$SOURCE_DIR/$script" "$TARGET_DIR/$script"
done

# Copy any additional files that might be in the project
print_status "Copying additional files..."
# Copy any .env files (excluding .env.local which shouldn't be copied)
if [ -f "$SOURCE_DIR/.env" ]; then
    cp "$SOURCE_DIR/.env" "$TARGET_DIR/.env.example"
    print_success "Copied .env file as .env.example"
fi

# Copy any other configuration files
for config_file in "$SOURCE_DIR"/*.{json,js,ts,yml,yaml}; do
    if [ -f "$config_file" ]; then
        filename=$(basename "$config_file")
        if [[ ! " ${FILES_TO_COPY[@]} " =~ " ${filename} " ]]; then
            copy_file_if_exists "$config_file" "$TARGET_DIR/$filename"
        fi
    fi
done

# Set executable permissions for scripts
print_status "Setting executable permissions..."
cd "$TARGET_DIR"
for script in "${SCRIPTS_TO_COPY[@]}"; do
    if [ -f "$script" ]; then
        chmod +x "$script"
        print_success "Made executable: $script"
    fi
done

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p "$TARGET_DIR/usr/bin"
mkdir -p "$TARGET_DIR/logs"

# Copy cloudflared binary if it exists
if [ -f "$SOURCE_DIR/usr/bin/cloudflared" ]; then
    mkdir -p "$TARGET_DIR/usr/bin"
    cp "$SOURCE_DIR/usr/bin/cloudflared" "$TARGET_DIR/usr/bin/cloudflared"
    chmod +x "$TARGET_DIR/usr/bin/cloudflared"
    print_success "Copied cloudflared binary"
fi

# Copy any log files
print_status "Copying log files..."
for log_file in "$SOURCE_DIR"/*.log; do
    if [ -f "$log_file" ]; then
        filename=$(basename "$log_file")
        cp "$log_file" "$TARGET_DIR/$filename"
        print_success "Copied log file: $filename"
    fi
done

# Show summary
print_success "🎉 File copy completed successfully!"
echo ""
echo "📊 COPY SUMMARY:"
echo "   Source:      $SOURCE_DIR"
echo "   Target:      $TARGET_DIR"
echo "   Backup:      $BACKUP_DIR"
echo ""
echo "📁 FILES COPIED:"
echo "   ✅ Main project files"
echo "   ✅ Installation scripts"
echo "   ✅ Configuration files"
echo "   ✅ Documentation"
echo "   ✅ Cloudflared binary (if exists)"
echo "   ✅ Log files"
echo ""
echo "🚀 NEXT STEPS:"
echo "   1. Navigate to target directory: cd $TARGET_DIR"
echo "   2. Run the installer: bash INSTALL-RUN-NOW.sh"
echo "   3. Or use quick launch: ./launch.sh"
echo ""
echo "📋 USEFUL COMMANDS:"
echo "   cd $TARGET_DIR                    # Change to target directory"
echo "   bash INSTALL-RUN-NOW.sh           # Full install & launch"
echo "   ./launch.sh                       # Quick launch"
echo "   ./status.sh                       # Check status"
echo "   ./stop.sh                         # Stop services"
echo ""
echo "🔧 IF YOU NEED TO RESTORE:"
echo "   rm -rf $TARGET_DIR"
echo "   mv $BACKUP_DIR $TARGET_DIR"
echo ""
echo -e "${GREEN}✨ All Proximity files have been copied to the target directory!${NC}"
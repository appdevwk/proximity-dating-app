#!/usr/bin/env python3
"""
Proximity Files Copy Script
Copies all Proximity files to target directory: /home/z/my-project
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path
from datetime import datetime

def print_status(message, status="INFO"):
    colors = {
        "INFO": "\033[0;34m",
        "SUCCESS": "\033[0;32m", 
        "WARNING": "\033[1;33m",
        "ERROR": "\033[0;31m",
        "RESET": "\033[0m"
    }
    print(f"{colors.get(status, '')}[{status}]{colors['RESET']} {message}")

def main():
    print_status("Starting Proximity files copy...", "INFO")
    
    source_dir = Path("/home/z/my-project")
    target_dir = Path("/home/z/my-project")
    
    # Check source directory
    if not source_dir.exists():
        print_status(f"Source directory {source_dir} does not exist", "ERROR")
        return False
    
    # Create target directory if needed
    target_dir.mkdir(parents=True, exist_ok=True)
    
    print_status(f"Source: {source_dir}")
    print_status(f"Target: {target_dir}")
    
    # Create backup if target exists and has files
    if target_dir.exists() and any(target_dir.iterdir()):
        backup_dir = Path(f"{target_dir}_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        print_status(f"Creating backup: {backup_dir}")
        shutil.copytree(target_dir, backup_dir)
        print_status("Backup created successfully", "SUCCESS")
    
    # Files and directories to copy
    important_items = [
        "package.json",
        "package-lock.json", 
        "next.config.ts",
        "tailwind.config.ts",
        "tsconfig.json",
        "server.ts",
        "prisma",
        "src",
        "public",
        "scripts",
        "components",
        "lib",
        "app",
        "pages",
        "styles",
        "types",
        "hooks",
        "utils",
        "contexts",
        "services",
        "middleware",
        "docs",
        "README.md",
        ".env.example",
        ".gitignore",
        ".eslintrc.json",
        ".prettierrc",
        "postcss.config.js",
        "tailwind.config.js",
    ]
    
    scripts_to_copy = [
        "install-proximity.sh",
        "launch.sh",
        "stop.sh", 
        "status.sh",
        "launch-proximity.py",
        "quick-launch.sh",
        "INSTALL-RUN-NOW.sh",
        "PROXIMITY-QUICK-START.md",
        "QUICK-COMMANDS.txt",
        "copy-to-target.sh",
        "copy-files.py"
    ]
    
    # Copy important items
    copied_count = 0
    for item in important_items:
        source_path = source_dir / item
        target_path = target_dir / item
        
        if source_path.exists():
            try:
                if source_path.is_file():
                    shutil.copy2(source_path, target_path)
                else:
                    if target_path.exists():
                        shutil.rmtree(target_path)
                    shutil.copytree(source_path, target_path)
                print_status(f"Copied: {item}", "SUCCESS")
                copied_count += 1
            except Exception as e:
                print_status(f"Failed to copy {item}: {e}", "WARNING")
        else:
            print_status(f"Not found: {item}", "WARNING")
    
    # Copy scripts
    for script in scripts_to_copy:
        source_path = source_dir / script
        target_path = target_dir / script
        
        if source_path.exists():
            try:
                shutil.copy2(source_path, target_path)
                # Make executable if it's a script
                if script.endswith('.sh'):
                    os.chmod(target_path, 0o755)
                print_status(f"Copied script: {script}", "SUCCESS")
                copied_count += 1
            except Exception as e:
                print_status(f"Failed to copy {script}: {e}", "WARNING")
    
    # Copy additional files
    additional_files = []
    for file_path in source_dir.iterdir():
        if file_path.is_file() and file_path.name not in important_items + scripts_to_copy:
            if file_path.suffix in ['.json', '.js', '.ts', '.yml', '.yaml', '.md', '.txt']:
                additional_files.append(file_path.name)
    
    for file_name in additional_files:
        source_path = source_dir / file_name
        target_path = target_dir / file_name
        
        try:
            shutil.copy2(source_path, target_path)
            print_status(f"Copied additional file: {file_name}", "SUCCESS")
            copied_count += 1
        except Exception as e:
            print_status(f"Failed to copy {file_name}: {e}", "WARNING")
    
    # Copy cloudflared binary if exists
    cloudflared_source = source_dir / "usr" / "bin" / "cloudflared"
    if cloudflared_source.exists():
        try:
            (target_dir / "usr" / "bin").mkdir(parents=True, exist_ok=True)
            target_path = target_dir / "usr" / "bin" / "cloudflared"
            shutil.copy2(cloudflared_source, target_path)
            os.chmod(target_path, 0o755)
            print_status("Copied cloudflared binary", "SUCCESS")
            copied_count += 1
        except Exception as e:
            print_status(f"Failed to copy cloudflared: {e}", "WARNING")
    
    # Copy log files
    log_files = list(source_dir.glob("*.log"))
    for log_file in log_files:
        try:
            shutil.copy2(log_file, target_dir / log_file.name)
            print_status(f"Copied log file: {log_file.name}", "SUCCESS")
            copied_count += 1
        except Exception as e:
            print_status(f"Failed to copy {log_file.name}: {e}", "WARNING")
    
    # Create necessary directories
    (target_dir / "usr" / "bin").mkdir(parents=True, exist_ok=True)
    (target_dir / "logs").mkdir(parents=True, exist_ok=True)
    
    print_status(f"\n🎉 Copy completed! Copied {copied_count} items", "SUCCESS")
    print_status(f"Target directory: {target_dir}", "INFO")
    
    print_status("\n🚀 Next steps:", "INFO")
    print_status("1. Navigate to target directory", "INFO")
    print_status("2. Run: bash INSTALL-RUN-NOW.sh", "INFO")
    print_status("3. Or use: ./launch.sh", "INFO")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        if success:
            print_status("\n✨ All files copied successfully!", "SUCCESS")
        else:
            print_status("\n❌ Copy failed", "ERROR")
            sys.exit(1)
    except KeyboardInterrupt:
        print_status("\n⚠️  Copy interrupted by user", "WARNING")
        sys.exit(1)
    except Exception as e:
        print_status(f"\n❌ Unexpected error: {e}", "ERROR")
        sys.exit(1)
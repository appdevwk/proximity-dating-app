#!/usr/bin/env python3
"""
Proximity One-Click Launcher
This script launches the Proximity dating application with Cloudflare tunnel
"""

import os
import sys
import subprocess
import time
import signal
import threading
import requests
from pathlib import Path

class ProximityLauncher:
    def __init__(self):
        self.project_dir = Path(__file__).parent
        self.nextjs_process = None
        self.cloudflared_process = None
        self.tunnel_url = None
        
    def print_status(self, message, status="INFO"):
        colors = {
            "INFO": "\033[0;34m",
            "SUCCESS": "\033[0;32m", 
            "WARNING": "\033[1;33m",
            "ERROR": "\033[0;31m",
            "RESET": "\033[0m"
        }
        print(f"{colors.get(status, '')}[{status}]{colors['RESET']} {message}")
        
    def check_dependencies(self):
        """Check if required dependencies are installed"""
        self.print_status("Checking dependencies...")
        
        # Check Node.js
        try:
            result = subprocess.run(['node', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                self.print_status(f"Node.js {result.stdout.strip()} found", "SUCCESS")
            else:
                self.print_status("Node.js not found. Please install Node.js.", "ERROR")
                return False
        except FileNotFoundError:
            self.print_status("Node.js not found. Please install Node.js.", "ERROR")
            return False
            
        # Check npm
        try:
            result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                self.print_status(f"npm {result.stdout.strip()} found", "SUCCESS")
            else:
                self.print_status("npm not found. Please install npm.", "ERROR")
                return False
        except FileNotFoundError:
            self.print_status("npm not found. Please install npm.", "ERROR")
            return False
            
        # Check Python 3
        if sys.version_info >= (3, 6):
            self.print_status(f"Python {sys.version.split()[0]} found", "SUCCESS")
        else:
            self.print_status("Python 3.6+ required. Please upgrade Python.", "ERROR")
            return False
            
        return True
        
    def install_dependencies(self):
        """Install Node.js dependencies"""
        self.print_status("Installing Node.js dependencies...")
        
        try:
            result = subprocess.run(['npm', 'install'], 
                                  cwd=self.project_dir, 
                                  capture_output=True, 
                                  text=True, 
                                  timeout=300)
            
            if result.returncode == 0:
                self.print_status("Dependencies installed successfully", "SUCCESS")
                return True
            else:
                self.print_status(f"Failed to install dependencies: {result.stderr}", "ERROR")
                return False
                
        except subprocess.TimeoutExpired:
            self.print_status("Dependency installation timed out", "ERROR")
            return False
        except Exception as e:
            self.print_status(f"Error installing dependencies: {e}", "ERROR")
            return False
            
    def setup_cloudflared(self):
        """Setup Cloudflared binary"""
        self.print_status("Setting up Cloudflared...")
        
        cloudflared_path = self.project_dir / "usr" / "bin" / "cloudflared"
        
        if cloudflared_path.exists():
            self.print_status("Cloudflared already setup", "SUCCESS")
            return True
            
        # Create directories
        (self.project_dir / "usr" / "bin").mkdir(parents=True, exist_ok=True)
        
        # Download Cloudflared
        try:
            self.print_status("Downloading Cloudflared...")
            result = subprocess.run([
                'curl', '-L', 
                'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb',
                '-o', str(self.project_dir / 'cloudflared.deb')
            ], capture_output=True, text=True, timeout=120)
            
            if result.returncode != 0:
                self.print_status("Failed to download Cloudflared", "ERROR")
                return False
                
            # Extract Cloudflared
            self.print_status("Extracting Cloudflared...")
            subprocess.run(['ar', 'x', str(self.project_dir / 'cloudflared.deb')], 
                          cwd=self.project_dir, check=True)
            subprocess.run(['tar', 'xf', str(self.project_dir / 'data.tar.gz')], 
                          cwd=self.project_dir, check=True)
            
            # Make executable
            cloudflared_path.chmod(0o755)
            
            # Cleanup
            for f in ['cloudflared.deb', 'debian-binary', 'control.tar.gz', 'data.tar.gz']:
                file_path = self.project_dir / f
                if file_path.exists():
                    file_path.unlink()
                    
            self.print_status("Cloudflared setup completed", "SUCCESS")
            return True
            
        except Exception as e:
            self.print_status(f"Error setting up Cloudflared: {e}", "ERROR")
            return False
            
    def start_nextjs(self):
        """Start Next.js development server"""
        self.print_status("Starting Next.js server...")
        
        try:
            # Kill existing processes
            subprocess.run(['pkill', '-f', 'node\|tsx'], capture_output=True)
            
            # Start Next.js
            self.nextjs_process = subprocess.Popen([
                'npm', 'run', 'dev'
            ], cwd=self.project_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # Wait for server to start
            self.print_status("Waiting for Next.js to start...")
            for i in range(30):  # 30 second timeout
                try:
                    response = requests.get('http://localhost:3001', timeout=2)
                    if response.status_code == 200:
                        self.print_status("Next.js server started successfully", "SUCCESS")
                        return True
                except:
                    pass
                time.sleep(1)
                
            self.print_status("Next.js server failed to start", "ERROR")
            return False
            
        except Exception as e:
            self.print_status(f"Error starting Next.js: {e}", "ERROR")
            return False
            
    def start_cloudflared(self):
        """Start Cloudflare tunnel"""
        self.print_status("Starting Cloudflare tunnel...")
        
        try:
            cloudflared_path = self.project_dir / "usr" / "bin" / "cloudflared"
            
            # Start Cloudflared
            self.cloudflared_process = subprocess.Popen([
                str(cloudflared_path), 'tunnel', '--url', 'http://localhost:3001'
            ], cwd=self.project_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            # Wait for URL
            self.print_status("Waiting for tunnel URL...")
            start_time = time.time()
            while time.time() - start_time < 30:  # 30 second timeout
                # Check process output
                if self.cloudflared_process.poll() is not None:
                    self.print_status("Cloudflared process died", "ERROR")
                    return False
                    
                # Read output
                line = self.cloudflared_process.stdout.readline()
                if line and "trycloudflare.com" in line:
                    # Extract URL
                    import re
                    url_match = re.search(r'https://[a-z-]+\.trycloudflare\.com', line)
                    if url_match:
                        self.tunnel_url = url_match.group()
                        self.print_status(f"Cloudflare tunnel started successfully", "SUCCESS")
                        self.print_status(f"Public URL: {self.tunnel_url}", "SUCCESS")
                        return True
                        
                time.sleep(0.5)
                
            self.print_status("Cloudflare tunnel failed to start", "ERROR")
            return False
            
        except Exception as e:
            self.print_status(f"Error starting Cloudflare: {e}", "ERROR")
            return False
            
    def stop_services(self):
        """Stop all services"""
        self.print_status("Stopping services...")
        
        if self.nextjs_process:
            self.nextjs_process.terminate()
            self.nextjs_process = None
            
        if self.cloudflared_process:
            self.cloudflared_process.terminate()
            self.cloudflared_process = None
            
        # Kill any remaining processes
        subprocess.run(['pkill', '-f', 'node\|tsx\|cloudflared'], capture_output=True)
        
        self.print_status("All services stopped", "SUCCESS")
        
    def show_status(self):
        """Show current status"""
        self.print_status("Checking service status...")
        
        # Check Next.js
        try:
            response = requests.get('http://localhost:3001', timeout=2)
            if response.status_code == 200:
                self.print_status("Next.js server is running", "SUCCESS")
            else:
                self.print_status("Next.js server is not responding", "ERROR")
        except:
            self.print_status("Next.js server is not running", "ERROR")
            
        # Check Cloudflare
        if self.cloudflared_process and self.cloudflared_process.poll() is None:
            self.print_status("Cloudflare tunnel is running", "SUCCESS")
            if self.tunnel_url:
                self.print_status(f"Public URL: {self.tunnel_url}", "SUCCESS")
        else:
            self.print_status("Cloudflare tunnel is not running", "ERROR")
            
    def run(self):
        """Main launcher function"""
        print("🚀 Proximity One-Click Launcher")
        print("=" * 50)
        
        try:
            # Check dependencies
            if not self.check_dependencies():
                return False
                
            # Install dependencies
            if not self.install_dependencies():
                return False
                
            # Setup Cloudflared
            if not self.setup_cloudflared():
                return False
                
            # Start services
            if not self.start_nextjs():
                return False
                
            if not self.start_cloudflared():
                return False
                
            print("\n🎉 Proximity Launched Successfully!")
            print("=" * 50)
            self.show_status()
            
            print(f"\n📱 Access your application:")
            print(f"   Local: http://localhost:3001")
            if self.tunnel_url:
                print(f"   Public: {self.tunnel_url}")
                
            print(f"\n📝 Press Ctrl+C to stop all services")
            
            # Keep running until interrupted
            try:
                while True:
                    time.sleep(1)
                    # Check if processes are still running
                    if (self.nextjs_process and self.nextjs_process.poll() is not None) or \
                       (self.cloudflared_process and self.cloudflared_process.poll() is not None):
                        print("\n⚠️  One or more services stopped unexpectedly")
                        break
                        
            except KeyboardInterrupt:
                print(f"\n🛑 Stopping services...")
                
            finally:
                self.stop_services()
                
            return True
            
        except Exception as e:
            self.print_status(f"Launcher error: {e}", "ERROR")
            return False

def main():
    """Main entry point"""
    launcher = ProximityLauncher()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "stop":
            launcher.stop_services()
        elif command == "status":
            launcher.show_status()
        elif command == "help":
            print("Proximity One-Click Launcher")
            print("")
            print("Usage: python3 launch-proximity.py [COMMAND]")
            print("")
            print("Commands:")
            print("  (none)   - Launch Proximity (default)")
            print("  stop     - Stop all services")
            print("  status   - Show service status")
            print("  help     - Show this help")
        else:
            print(f"Unknown command: {command}")
            print("Use 'python3 launch-proximity.py help' for usage")
    else:
        launcher.run()

if __name__ == "__main__":
    main()
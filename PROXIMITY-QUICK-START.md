# Proximity One-Click Installation & Launch Guide

## 🚀 Quick Start - One Command Launch

### Option 1: Simple Launch (Recommended)
```bash
# Launch Proximity with Cloudflare tunnel in one command
bash <(curl -s https://raw.githubusercontent.com/your-repo/proximity/main/quick-launch.sh)
```

### Option 2: Manual Launch
```bash
# 1. Launch Proximity
./launch.sh

# 2. Check status
./status.sh

# 3. Stop services
./stop.sh
```

### Option 3: Python Launcher (Advanced)
```bash
# Launch with Python launcher
python3 launch-proximity.py

# Other commands
python3 launch-proximity.py stop    # Stop services
python3 launch-proximity.py status  # Check status
python3 launch-proximity.py help    # Show help
```

## 📋 Prerequisites

The launcher will automatically check and install:
- ✅ Node.js 18+
- ✅ npm
- ✅ Python 3.6+
- ✅ curl
- ✅ Cloudflared

## 🛠️ Installation Scripts

### 1. Complete Installation Script
```bash
# Full installation with all dependencies
./install-proximity.sh install
```

### 2. Quick Launch Script
```bash
# Just launch existing installation
./launch.sh
```

### 3. Status Check
```bash
# Check if services are running
./status.sh
```

### 4. Stop Services
```bash
# Stop all services
./stop.sh
```

## 🌐 Access URLs

After launching, you can access Proximity at:

- **Local Development**: `http://localhost:3001`
- **Public Access**: `https://[random-words].trycloudflare.com` (auto-generated)

## 🔧 Manual Setup (If Scripts Fail)

### Step 1: Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs npm python3 curl

# Verify installation
node --version
npm --version
python3 --version
```

### Step 2: Install Project Dependencies
```bash
# Install Node.js packages
npm install

# Setup database (if using Prisma)
npm run db:push
npm run db:generate
```

### Step 3: Setup Cloudflared
```bash
# Download Cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb

# Extract binary
ar x cloudflared.deb
tar xf data.tar.gz
chmod +x ./usr/bin/cloudflared

# Clean up
rm -f cloudflared.deb debian-binary control.tar.gz data.tar.gz
```

### Step 4: Launch Services
```bash
# Start Next.js server
npm run dev &

# Wait 10 seconds, then start Cloudflare tunnel
./usr/bin/cloudflared tunnel --url http://localhost:3001 &
```

## 📊 Service Management

### Check Status
```bash
# Check Next.js server
curl -I http://localhost:3001

# Check Cloudflare tunnel
ps aux | grep cloudflared

# View logs
tail -f nextjs.log
tail -f cloudflared.log
```

### Restart Services
```bash
# Stop all services
pkill -f "node\|tsx\|cloudflared"

# Start again
./launch.sh
```

## 🔍 Troubleshooting

### Common Issues

1. **Port 3001 is already in use**
   ```bash
   # Find process using port 3001
   lsof -i :3001
   
   # Kill the process
   kill -9 [PID]
   ```

2. **Cloudflare tunnel not starting**
   ```bash
   # Check if cloudflared binary exists
   ls -la ./usr/bin/cloudflared
   
   # Check permissions
   chmod +x ./usr/bin/cloudflared
   ```

3. **Node.js dependencies not installing**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Delete node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Application not accessible**
   ```bash
   # Check if Next.js is running
   ps aux | grep "node\|tsx"
   
   # Check if port is open
   netstat -tlnp | grep 3001
   
   # Test local connection
   curl http://localhost:3001
   ```

### Log Files
- `nextjs.log` - Next.js server logs
- `cloudflared.log` - Cloudflare tunnel logs
- `dev.log` - Development server logs

## 🌍 Cloudflare Tunnel Information

The Cloudflare tunnel provides:
- ✅ Public HTTPS access
- ✅ Automatic SSL certificate
- ✅ Global CDN
- ✅ DDoS protection

**Note**: The tunnel URL changes each time you restart the service. For a permanent URL, consider:
1. Using a custom domain
2. Setting up a named Cloudflare tunnel
3. Deploying to a hosting service

## 🚀 Production Deployment

For production use, consider:
- **Vercel**: `npm run build && npx vercel`
- **Netlify**: Connect your GitHub repository
- **Digital Ocean**: Use App Platform
- **AWS**: Use Elastic Beanstalk or Amplify

## 📞 Support

If you encounter issues:
1. Check the log files
2. Run `./status.sh` to diagnose
3. Check the troubleshooting section above
4. Restart services with `./stop.sh && ./launch.sh`

---

**🎉 Proximity is now ready to use! Run `./launch.sh` to start your dating platform.**
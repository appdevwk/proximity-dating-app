# PROXIMITY Dating App - Custom Domain Setup Guide

## Overview
This guide will help you set up your PROXIMITY dating application with the custom domain `proximitydatingapp.cloudflareaccess.com`.

## Prerequisites
- PROXIMITY app already installed and running
- Cloudflare account (free tier is sufficient)
- Domain access to proximitydatingapp.cloudflareaccess.com

## Setup Steps

### 1. Initial Setup
Run the custom domain setup script:

```bash
cd /home/z/my-project
./setup-custom-domain.sh
```

This script will:
- Check if Cloudflare tools are installed
- Verify Cloudflare authentication
- Create a new tunnel
- Set up DNS records
- Configure the tunnel for your custom domain

### 2. Cloudflare Authentication
If you're not logged in to Cloudflare, the script will prompt you to authenticate:

```bash
cloudflared tunnel login
```

Follow the instructions to:
1. Get a temporary token
2. Open the provided URL in your browser
3. Select your Cloudflare account and domain
4. Complete the authentication

### 3. Domain Configuration
Make sure your domain `proximitydatingapp.cloudflareaccess.com` is properly configured:

1. **DNS Settings**: Ensure your domain is using Cloudflare nameservers
2. **SSL/TLS**: Set to "Full" (strict) mode
3. **Proxy Status**: Enabled (orange cloud)

### 4. Launch with Custom Domain
Once setup is complete, launch the app with your custom domain:

```bash
./launch-custom-domain.sh
```

This will:
- Start the Next.js server (if not already running)
- Launch the Cloudflare tunnel with your custom domain
- Provide you with the access URL

### 5. Access Your Application
Your PROXIMITY dating app will be available at:
```
https://proximitydatingapp.cloudflareaccess.com
```

## Management Commands

### Start Services
```bash
# Start with custom domain
./launch-custom-domain.sh

# Start with temporary domain (original)
./launch.sh
```

### Stop Services
```bash
./stop.sh
```

### Check Status
```bash
./status.sh
```

### View Logs
```bash
# Server logs
tail -f server.log

# Custom domain tunnel logs
tail -f cloudflared-custom.log

# Original tunnel logs
tail -f cloudflared.log
```

## Troubleshooting

### Common Issues

#### 1. "Domain not found" error
- Check DNS propagation: `dig proximitydatingapp.cloudflareaccess.com`
- Wait 24-48 hours for DNS to fully propagate
- Verify Cloudflare DNS settings

#### 2. "SSL certificate error"
- Ensure SSL/TLS mode is set to "Full" (strict)
- Check that your origin certificate is properly configured
- Wait for certificate issuance (can take up to 24 hours)

#### 3. "Tunnel not found" error
- Check if tunnel exists: `cloudflared tunnel list`
- Verify configuration file: `cat ~/.cloudflared/config.yml`
- Recreate tunnel if necessary

#### 4. "Connection refused" error
- Check if Next.js server is running: `ps aux | grep "tsx server.ts"`
- Verify server is listening on port 3001: `netstat -tlnp | grep 3001`
- Check firewall settings

### Advanced Troubleshooting

#### Reset Tunnel Configuration
```bash
# Remove existing configuration
rm -f ~/.cloudflared/config.yml
rm -f ~/.cloudflared/*.json

# Recreate tunnel
cloudflared tunnel delete <tunnel-name>
./setup-custom-domain.sh
```

#### Check Tunnel Status
```bash
cloudflared tunnel list
cloudflared tunnel info <tunnel-name>
cloudflared tunnel dns <tunnel-name> proximitydatingapp.cloudflareaccess.com
```

#### Test Connection
```bash
# Test local server
curl http://localhost:3001

# Test through tunnel
curl -H "Host: proximitydatingapp.cloudflareaccess.com" http://localhost:3001
```

## Configuration Files

### Cloudflare Configuration
Location: `~/.cloudflared/config.yml`
```yaml
tunnel: <your-tunnel-uuid>
credentials-file: ~/.cloudflared/<your-tunnel-uuid>.json

ingress:
  - hostname: proximitydatingapp.cloudflareaccess.com
    service: http://localhost:3001
  - service: http_status:404
```

### Application Configuration
Location: `/home/z/my-project/server.ts`
- Server runs on port 3001
- Handles both HTTP and WebSocket connections
- Configured for production environment

## Security Considerations

### 1. Access Control
- Consider implementing IP whitelisting
- Use Cloudflare Access for additional authentication
- Enable WAF rules for protection

### 2. SSL/TLS
- Always use HTTPS
- Keep SSL/TLS certificates updated
- Monitor certificate expiration

### 3. Rate Limiting
- Configure Cloudflare rate limiting
- Implement application-level rate limiting
- Monitor for abuse

## Performance Optimization

### 1. Caching
- Enable Cloudflare caching for static assets
- Configure browser caching headers
- Use CDN for global distribution

### 2. Compression
- Enable Brotli compression in Cloudflare
- Configure server-side compression
- Optimize image and asset sizes

### 3. Monitoring
- Set up Cloudflare analytics
- Monitor tunnel performance
- Track uptime and response times

## Support

If you encounter any issues:
1. Check the logs in `/home/z/my-project/`
2. Review Cloudflare dashboard for tunnel status
3. Consult Cloudflare documentation
4. Contact support if needed

---

**Note**: This setup assumes you have administrative access to the Cloudflare account managing the `proximitydatingapp.cloudflareaccess.com` domain.
# VPS Setup Guide for Algod WebSocket Proxy

## Overview

This guide helps you set up the WebSocket algod proxy on your VPS at `your_server_url` to provide real-time mempool data to your web app.

## Prerequisites

- VPS (yours: `user@your_server_url`)
- Algorand node running with API token
- Node.js installed on VPS
- Basic firewall configuration

## Step 1: VPS Connection & Dependencies

```bash
# Connect to your VPS
ssh user@your_server_url

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

## Step 2: Install WebSocket Dependencies

```bash
# Create directory for the WebSocket server
mkdir -p ~/algod-websocket
cd ~/algod-websocket

# Initialize npm project
npm init -y

# Install dependencies
npm install ws node-fetch

# Create package.json scripts
npm pkg set scripts.start="node websocket-server.js"
npm pkg set scripts.dev="node websocket-server.js"
```

## Step 3: Copy WebSocket Server Script

```bash
# Copy the websocket-server.js file to your VPS
# Either upload via scp or create the file directly:

nano websocket-server.js
```

Copy the entire content from `../websocket-server.js` into this file.

## Step 4: Configure Environment Variables

```bash
# Create environment file
nano .env

# Copy from template (if available)
cp .env.template .env

# Add your configuration:
ALGOD_TOKEN=your_actual_algod_token_here
ALGOD_SERVER=http://localhost
ALGOD_PORT=8080
WS_PORT=8081
WS_AUTH_TOKEN=your_websocket_auth_token_here
```

**Important**: Replace `your_actual_algod_token_here` and `your_websocket_auth_token_here` with your real tokens.

## Step 5: Test Algod Connection

```bash
# Test if your algod node is accessible
curl -H "X-Algo-API-Token: your_actual_algod_token_here" \
     http://localhost:8080/v2/status

# Should return JSON with node status
```

## Step 6: Firewall Configuration

```bash
# Allow WebSocket port (8081) through firewall
sudo ufw allow 8081/tcp

# Check firewall status
sudo ufw status

# If UFW is not enabled, enable it (optional)
sudo ufw enable
```

## Step 7: Run WebSocket Server

```bash
# Load environment variables and start server
source .env && node websocket-server.js

# You should see output like:
# 🚀 Starting Algod WebSocket Algod Proxy Server
# 📡 Algod endpoint: http://localhost:8080
# 🔌 WebSocket server port: 8081
# ✅ Algod connection successful - Round: 12345678
# ✅ WebSocket server listening on port 8081
# 🌐 Clients can connect to: ws://your_server_url:8081/algod
```

## Step 8: Test WebSocket Connection

From your local machine, test the connection:

```bash
# Install a WebSocket testing tool
npm install -g wscat

# Test connection
wscat -c ws://your_server_url:8081/algod

# Send test request
{"endpoint": "/v2/status", "method": "GET"}

# Should receive algod status response
```

## Step 9: Configure Your Web App

Update your local `.env` file:

```env
ALGOD_WS_URL=ws://your_server_url:8081/algod
ALGOD_SERVER=http://your_server_url:8080
```

## Step 10: Run as Service (Production)

Create a systemd service for production deployment:

```bash
# Create service file
sudo nano /etc/systemd/system/algod-websocket.service

# Add service configuration:
[Unit]
Description=algod WebSocket Algod Proxy
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/algod-websocket
Environment=NODE_ENV=production
Environment=ALGOD_TOKEN=your_actual_algod_token_here
Environment=ALGOD_SERVER=http://localhost
Environment=ALGOD_PORT=8080
Environment=WS_PORT=8081
Environment=WS_AUTH_TOKEN=your_websocket_auth_token_here
ExecStart=/usr/bin/node websocket-server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable algod-websocket
sudo systemctl start algod-websocket

# Check service status
sudo systemctl status algod-websocket

# View logs
sudo journalctl -u algod-websocket -f
```

## Troubleshooting

### Connection Issues

1. **WebSocket connection fails**:
   ```bash
   # Check if service is running
   sudo systemctl status algod-websocket
   
   # Check port is open
   sudo netstat -tlnp | grep 8081
   
   # Check firewall
   sudo ufw status
   ```

2. **Algod connection fails**:
   ```bash
   # Verify algod is running
   ps aux | grep algod
   
   # Test algod directly
   curl -H "X-Algo-API-Token: YOUR_TOKEN" http://localhost:8080/v2/status
   
   # Check algod logs
   tail -f ~/node/data/algod-out.log
   ```

3. **Permission errors**:
   ```bash
   # Ensure correct file permissions
   chmod +x websocket-server.js
   chown ubuntu:ubuntu ~/algod-websocket/*
   ```

### Monitoring & Logs

```bash
# View real-time WebSocket logs
sudo journalctl -u algod-websocket -f

# View last 100 log lines
sudo journalctl -u algod-websocket -n 100

# Check service performance
htop

# Monitor network connections
ss -tulpn | grep 8081
```

## Security Considerations

1. **Firewall**: Only expose port 8081, keep algod port 8080 internal
2. **Token Security**: Algod token stays on VPS, never exposed to clients
3. **HTTPS**: Consider SSL termination with nginx for production (`wss://`)
4. **Rate Limiting**: Monitor connection counts and implement limits if needed

## Next Steps

1. Start your algod web app
2. Check browser console for WebSocket connection success
3. Monitor mempool data flowing in real-time (20ms intervals)
4. Verify fallback works by stopping WebSocket service temporarily

Your WebSocket proxy is now providing real-time algod access to your algod application!

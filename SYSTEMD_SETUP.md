# Systemd Service Setup for TurboPi

This guide shows how to set up TurboPi as a systemd service on your Raspberry Pi, enabling automatic startup on boot and easy service management.

## Prerequisites

- TurboPi installed at `/home/pi/turbopi` (adjust paths if different)
- Production build completed: `npm run build`
- `.env` file configured with proper environment variables

## Installation Steps

### 1. Copy Service File to Systemd Directory

```bash
sudo cp turbopi.service /etc/systemd/system/turbopi.service
```

### 2. Adjust Paths (if needed)

If your TurboPi installation is NOT at `/home/pi/turbopi`, edit the service file:

```bash
sudo nano /etc/systemd/system/turbopi.service
```

Update these lines:
- `User=pi` - Change to your username
- `Group=pi` - Change to your group
- `WorkingDirectory=/home/pi/turbopi` - Change to your installation path

### 3. Reload Systemd Configuration

```bash
sudo systemctl daemon-reload
```

### 4. Enable Auto-Start on Boot

```bash
sudo systemctl enable turbopi
```

### 5. Start the Service

```bash
sudo systemctl start turbopi
```

### 6. Verify It's Running

```bash
sudo systemctl status turbopi
```

You should see:
- `Active: active (running)` in green
- Recent log entries showing TurboPi started successfully

## Service Management Commands

### Start/Stop/Restart

```bash
# Start the service
sudo systemctl start turbopi

# Stop the service
sudo systemctl stop turbopi

# Restart the service (after updates)
sudo systemctl restart turbopi

# Reload systemd configuration (after editing service file)
sudo systemctl daemon-reload
sudo systemctl restart turbopi
```

### Check Status

```bash
# Quick status check
sudo systemctl status turbopi

# Check if enabled for auto-start
sudo systemctl is-enabled turbopi

# Check if currently running
sudo systemctl is-active turbopi
```

### Disable Auto-Start

```bash
# Stop auto-starting on boot (but doesn't stop current instance)
sudo systemctl disable turbopi

# Stop current instance
sudo systemctl stop turbopi
```

## Viewing Logs

Systemd captures all console output to the journal. Use `journalctl` to view logs:

### Live Tail (Follow Mode)

```bash
# Follow logs in real-time
sudo journalctl -u turbopi -f

# Press Ctrl+C to exit
```

### Recent Logs

```bash
# Last 50 lines
sudo journalctl -u turbopi -n 50

# Last 100 lines
sudo journalctl -u turbopi -n 100

# Logs from the last hour
sudo journalctl -u turbopi --since "1 hour ago"

# Logs from today
sudo journalctl -u turbopi --since today

# Logs from specific date/time
sudo journalctl -u turbopi --since "2025-01-15 14:00:00"
```

### Search Logs

```bash
# Search for errors
sudo journalctl -u turbopi | grep -i error

# Search for specific text
sudo journalctl -u turbopi | grep "torrent"
```

### Export Logs

```bash
# Save logs to file
sudo journalctl -u turbopi > turbopi-logs.txt

# Save logs from last boot
sudo journalctl -u turbopi -b > turbopi-logs-current-boot.txt
```

## Deployment Workflow

After making code changes and deploying to your Pi:

```bash
# Pull latest changes
cd ~/turbopi
git pull

# Install any new dependencies
npm install

# Build for production
npm run build

# Restart the service
sudo systemctl restart turbopi

# Check it started successfully
sudo systemctl status turbopi

# Optionally, tail logs to monitor
sudo journalctl -u turbopi -f
```

## Troubleshooting

### Service Won't Start

```bash
# Check detailed status
sudo systemctl status turbopi

# View recent errors
sudo journalctl -u turbopi -n 50

# Common issues:
# - Wrong WorkingDirectory path in service file
# - Missing .env file
# - npm or node not in PATH
# - Build not completed (run npm run build)
```

### Service Starts But Crashes

```bash
# View logs around the crash
sudo journalctl -u turbopi --since "5 minutes ago"

# Check for:
# - Port 3000 already in use
# - Missing environment variables
# - File permission issues
```

### Can't Access from Network

```bash
# Ensure service is running
sudo systemctl status turbopi

# Check if port is listening
sudo ss -tlnp | grep 3000

# Ensure avahi-daemon is running
sudo systemctl status avahi-daemon

# Test mDNS resolution
ping -c 1 turbopi.local
```

### Reset Service Completely

```bash
# Stop and disable
sudo systemctl stop turbopi
sudo systemctl disable turbopi

# Remove service file
sudo rm /etc/systemd/system/turbopi.service

# Reload systemd
sudo systemctl daemon-reload

# Verify removal
sudo systemctl status turbopi
# Should show "could not be found"
```

## Environment Variables

The service file sets `NODE_ENV=production` by default. To add more environment variables:

### Option 1: Edit Service File

```bash
sudo nano /etc/systemd/system/turbopi.service
```

Add lines in the `[Service]` section:

```ini
Environment=MOVIES_DIR=/media/movies
Environment=PORT=3000
Environment=HOST=0.0.0.0
```

Then reload and restart:

```bash
sudo systemctl daemon-reload
sudo systemctl restart turbopi
```

### Option 2: Use .env File (Recommended)

Keep your `.env` file in the working directory (`/home/pi/turbopi/.env`). The application will load it automatically via dotenv.

This is the recommended approach as it keeps secrets out of the service file.

## Security Notes

The service file includes optional security hardening settings (commented out):

```ini
# NoNewPrivileges=true     # Prevents privilege escalation
# PrivateTmp=true          # Isolates /tmp directory
```

To enable these, uncomment the lines in `/etc/systemd/system/turbopi.service` and reload:

```bash
sudo systemctl daemon-reload
sudo systemctl restart turbopi
```

## Monitoring & Maintenance

### Check Service on Boot

After rebooting your Pi:

```bash
# Wait for boot to complete, then check
sudo systemctl status turbopi

# Should show "Active: active (running)"
```

### Monitor Resource Usage

```bash
# Show memory and CPU usage for turbopi
systemctl status turbopi

# More detailed resource info
sudo systemctl show turbopi --property=MemoryCurrent,CPUUsageNSec
```

### View Service Configuration

```bash
# Show the service file
sudo systemctl cat turbopi

# Show all service properties
sudo systemctl show turbopi
```

## Uninstall

To completely remove the systemd service:

```bash
# Stop and disable service
sudo systemctl stop turbopi
sudo systemctl disable turbopi

# Remove service file
sudo rm /etc/systemd/system/turbopi.service

# Reload systemd
sudo systemctl daemon-reload

# Verify removal
sudo systemctl status turbopi
```

Your TurboPi application files remain untouched - this only removes the service configuration.

## Benefits of This Setup

- **Auto-Start**: TurboPi starts automatically when Pi boots
- **Auto-Restart**: Crashes are automatically recovered (RestartSec=10)
- **Centralized Logs**: All logs in systemd journal with rotation
- **Standard Management**: Uses same commands as other Linux services
- **Dependency Handling**: Waits for network and Avahi before starting
- **Zero Additional Dependencies**: Uses built-in systemd (no PM2 or Docker needed)

## Next Steps

- Set up automatic Git pulls and service restarts with a cron job
- Configure logrotate for application-specific logs (if writing to files)
- Monitor service health with monitoring tools (Prometheus, etc.)

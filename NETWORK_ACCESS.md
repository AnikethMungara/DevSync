# Accessing DevSync from Other Devices

This guide explains how to access your DevSync IDE from other devices on your network (phones, tablets, other computers).

## ⚡ Easiest Method: Automated Setup Script

1. **Run the setup script** (as Administrator for firewall rules):
   ```bash
   setup-network-access.bat
   ```

2. **The script automatically**:
   - Detects your IP address
   - Updates backend configuration
   - Updates frontend configuration
   - Adds Windows Firewall rules
   - Shows you the URLs to access DevSync

3. **Restart DevSync**:
   ```bash
   START.bat
   ```

4. **Access from other devices**:
   - Connect to same Wi-Fi network
   - Open browser to: `http://YOUR_IP:3000`
   - (The script shows you the exact URL)

---

## 📋 Manual Setup (Step-by-Step)

If you prefer manual configuration or need to troubleshoot:

### Manual Step 1: Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually something like `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
# or
ip addr show
```
Look for `inet` address (usually `192.168.x.x` or `10.0.x.x`)

### Manual Step 2: Update Backend Configuration

Edit `backend/.env` and change the `FRONTEND_URL`:

```env
# Replace localhost with your computer's IP address
FRONTEND_URL=http://192.168.1.100:3000

# Example if your IP is 192.168.1.50:
# FRONTEND_URL=http://192.168.1.50:3000
```

**Important**: Replace `192.168.1.100` with YOUR actual IP address from Step 1.

### Manual Step 3: Update Frontend Configuration

Edit `frontend/package.json` to allow network access:

```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0"
  }
}
```

Or create a `.env.local` file in the `frontend` directory:

```env
# Frontend environment variables
NEXT_PUBLIC_BACKEND_URL=http://192.168.1.100:8787
```

Replace `192.168.1.100` with YOUR computer's IP address.

### Manual Step 4: Update CORS Settings

The backend is already configured to accept connections from any origin when `FRONTEND_URL` is set correctly. The current CORS configuration in `backend/main.py` allows:

```python
allow_origins=[settings.FRONTEND_URL]
```

For development, you may want to allow all origins temporarily. I'll create a script to help with this.

### Manual Step 5: Restart Servers

Stop and restart both backend and frontend:

```bash
# Stop all services (Ctrl+C in each window)

# Restart using START.bat
START.bat
```

### Manual Step 6: Access from Other Devices

On your other device (phone, tablet, another computer):

1. Connect to the **same Wi-Fi network** as your computer
2. Open a web browser
3. Navigate to: `http://YOUR_IP:3000`
   - Example: `http://192.168.1.100:3000`

## Detailed Configuration

### Environment Variables

Create/update `frontend/.env.local`:

```env
# Backend API URL (use your computer's IP)
NEXT_PUBLIC_BACKEND_URL=http://192.168.1.100:8787
```

Create/update `backend/.env`:

```env
# Server Settings
PORT=8787
HOST=0.0.0.0  # Already set - allows network connections

# Frontend URL (use your computer's IP)
FRONTEND_URL=http://192.168.1.100:3000
```

### Firewall Configuration

You may need to allow connections through your firewall:

**Windows Firewall:**
1. Open "Windows Defender Firewall"
2. Click "Allow an app through firewall"
3. Add rules for ports **3000** (frontend) and **8787** (backend)

Or via command line (Run as Administrator):
```bash
netsh advfirewall firewall add rule name="DevSync Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="DevSync Backend" dir=in action=allow protocol=TCP localport=8787
netsh advfirewall firewall add rule name="DevSync Agent" dir=in action=allow protocol=TCP localport=9001
```

**Mac Firewall:**
```bash
# Usually doesn't block by default, but if needed:
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /path/to/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /path/to/python
```

**Linux (ufw):**
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 8787/tcp
sudo ufw allow 9001/tcp
```

### Update START.bat for Network Access

The current `START.bat` should work, but verify the frontend starts with `-H 0.0.0.0`:

```batch
cd frontend && npm run dev -- -H 0.0.0.0
```

## Testing Connection

### Test Backend API
From another device, open browser and go to:
```
http://YOUR_IP:8787/health
```

You should see:
```json
{
  "status": "ok",
  "version": "2.0.0",
  "workspace": "workspace"
}
```

### Test Frontend
From another device, open browser and go to:
```
http://YOUR_IP:3000
```

You should see the DevSync IDE interface.

## Collaboration Across Network

When using collaboration features from different devices:

1. **Host** (your computer) creates a collaboration session
2. **Share the Session ID** with others
3. **Other devices** join using the same Session ID
4. All devices can now collaborate in real-time!

## Troubleshooting

### Cannot Connect from Other Device

**Check Network:**
```bash
# From other device, ping your computer
ping 192.168.1.100
```

If ping fails:
- Ensure both devices are on the same Wi-Fi network
- Check if your router has AP isolation enabled (disable it)
- Verify IP address is correct

**Check Firewall:**
- Temporarily disable firewall to test
- If it works, add proper firewall rules (see above)

**Check Services:**
```bash
# On your computer, verify servers are running
netstat -an | findstr "3000"
netstat -an | findstr "8787"
```

### CORS Errors

If you see CORS errors in browser console:

1. Update `backend/.env`:
```env
FRONTEND_URL=http://YOUR_IP:3000
```

2. Or temporarily allow all origins (development only):

Edit `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (dev only!)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### WebSocket Connection Failed

WebSocket connections need special handling:

1. Ensure `NEXT_PUBLIC_BACKEND_URL` uses `http://` (not `https://`)
2. The WebSocket will auto-upgrade from `http` to `ws`
3. Check browser console for WebSocket errors

### Static IP Recommended

Your IP address might change. To set a static IP:

**Windows:**
1. Control Panel → Network and Sharing Center
2. Change adapter settings
3. Right-click your network → Properties
4. Select "Internet Protocol Version 4 (TCP/IPv4)"
5. Choose "Use the following IP address"
6. Enter your desired IP (e.g., `192.168.1.100`)

**Router DHCP Reservation:**
- Log into your router (usually `192.168.1.1`)
- Find DHCP settings
- Reserve IP for your computer's MAC address

## Security Considerations

⚠️ **Important Security Notes:**

1. **Development Only**: This setup is for development/testing on trusted networks
2. **No Authentication**: DevSync currently has no authentication
3. **Trusted Networks**: Only use on private, trusted Wi-Fi networks
4. **Production**: For production, add:
   - HTTPS/TLS encryption
   - User authentication
   - API key validation
   - Rate limiting
   - Network security groups

## Advanced: Access from Internet (Not Recommended)

If you need to access from outside your network (NOT recommended without security):

1. **Port Forwarding** on your router:
   - Forward port 3000 → your computer's IP:3000
   - Forward port 8787 → your computer's IP:8787

2. **Dynamic DNS** (if your ISP changes your public IP):
   - Services like DuckDNS, No-IP, etc.

3. **VPN** (Recommended alternative):
   - Set up VPN to your home network
   - Access DevSync as if you're on local network
   - Much more secure!

## Quick Reference

| Service | Port | URL Format |
|---------|------|------------|
| Frontend | 3000 | `http://YOUR_IP:3000` |
| Backend API | 8787 | `http://YOUR_IP:8787` |
| AI Agent Service | 9001 | `http://YOUR_IP:9001` |
| Health Check | 8787 | `http://YOUR_IP:8787/health` |
| Collaboration WS | 8787 | `ws://YOUR_IP:8787/api/collaboration/sessions/{id}/ws` |

## Summary Checklist

- [ ] Find your computer's IP address
- [ ] Update `backend/.env` with `FRONTEND_URL=http://YOUR_IP:3000`
- [ ] Create `frontend/.env.local` with `NEXT_PUBLIC_BACKEND_URL=http://YOUR_IP:8787`
- [ ] Update `frontend/package.json` dev script to include `-H 0.0.0.0`
- [ ] Configure firewall to allow ports 3000, 8787, 9001
- [ ] Restart all services
- [ ] Test from other device on same network
- [ ] Share Session ID for collaboration!

---

Need help? Check the troubleshooting section or create an issue on GitHub! 🚀

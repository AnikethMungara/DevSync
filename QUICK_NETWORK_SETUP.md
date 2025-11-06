# Quick Network Access Setup

## Easiest Method: Use the Setup Script

1. **Run the setup script** (as Administrator for firewall rules):
   ```bash
   setup-network-access.bat
   ```

2. **The script will automatically**:
   - Detect your IP address
   - Update backend configuration
   - Update frontend configuration
   - Add Windows Firewall rules
   - Show you the URLs to access DevSync

3. **Restart DevSync**:
   ```bash
   START.bat
   ```

4. **Access from other devices**:
   - Connect to same Wi-Fi network
   - Open browser and go to: `http://YOUR_IP:3000`
   - (The script will show you the exact URL)

## Manual Method

If you prefer to configure manually:

### 1. Find Your IP Address
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.1.100`)

### 2. Update Backend Config
Edit `backend/.env`:
```env
FRONTEND_URL=http://192.168.1.100:3000
```
(Replace with your IP)

### 3. Update Frontend Config
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://192.168.1.100:8787
```
(Replace with your IP)

### 4. Allow Network Connections
Edit `frontend/package.json`:
```json
"dev": "next dev -H 0.0.0.0"
```

### 5. Configure Firewall
```bash
netsh advfirewall firewall add rule name="DevSync Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="DevSync Backend" dir=in action=allow protocol=TCP localport=8787
netsh advfirewall firewall add rule name="DevSync Agent" dir=in action=allow protocol=TCP localport=9001
```

### 6. Restart Servers
```bash
START.bat
```

## Test It

From another device on the same network:
- Open browser
- Go to: `http://YOUR_IP:3000`
- You should see DevSync!

## Troubleshooting

**Can't connect?**
1. Verify both devices are on same Wi-Fi
2. Check firewall is allowing connections
3. Try temporarily disabling firewall to test
4. Make sure servers are running (`START.bat`)

**CORS errors?**
- Restart backend after config changes
- Clear browser cache
- Check `backend/.env` has correct IP

## For More Details

See [NETWORK_ACCESS.md](NETWORK_ACCESS.md) for comprehensive documentation.

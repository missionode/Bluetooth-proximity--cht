# Bluetooth Proximity Chat PWA

A privacy-focused Progressive Web App that allows users to discover and chat with people nearby using Bluetooth technology. All sessions are temporary - no data is stored after you close the app.

## Features

- **PWA Installable**: Install on any device (Desktop, Android)
- **Fullscreen Mode**: Runs without browser UI
- **Live Camera Integration**: Take your photo every session
- **Bluetooth Discovery**: Find nearby users via Web Bluetooth API
- **Mutual Consent**: Both users must approve before connecting
- **Real-time Chat**: Send and receive messages over Bluetooth
- **Zero Persistence**: Complete privacy - all data deleted on app close
- **Offline Capable**: Works without internet connection

## Requirements

### Browser Support
- **Chrome** (Desktop & Android) ✅
- **Edge** (Desktop & Android) ✅
- **Opera** (Desktop & Android) ✅
- **Safari** (iOS) ❌ (Web Bluetooth not supported)

### Permissions Required
- Bluetooth
- Camera
- Notifications

### HTTPS Required
PWAs and Web Bluetooth API require HTTPS. You cannot run this on `http://` in production.

## Installation & Setup

### 1. Clone or Download
```bash
cd "Bluetooth proximity  cht"
```

### 2. Generate Icons
Open `icons/generate-icons.html` in your browser and save each canvas image as:
- icon-72.png
- icon-96.png
- icon-128.png
- icon-144.png
- icon-152.png
- icon-192.png
- icon-384.png
- icon-512.png

Place all icons in the `icons/` folder.

### 3. Serve Over HTTPS

#### Option A: Using Python (for local testing)
```bash
# Python 3
python3 -m http.server 8000
```
Then access at `http://localhost:8000`

**Note**: For full Bluetooth functionality, you need HTTPS. Use one of the options below:

#### Option B: Using Node.js http-server with SSL
```bash
npm install -g http-server
http-server -S -C cert.pem -K key.pem
```

#### Option C: Deploy to a Hosting Service
Deploy to any of these services (they provide HTTPS automatically):
- **GitHub Pages**
- **Netlify**
- **Vercel**
- **Firebase Hosting**
- **Cloudflare Pages**

### 4. For GitHub Pages Deployment
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: Bluetooth Proximity Chat PWA"

# Create GitHub repo and push
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main

# Enable GitHub Pages in repo settings
# Settings → Pages → Source: main branch
```

## How to Use

### Step 1: Open the App
Navigate to your deployed URL (must be HTTPS)

### Step 2: Install (Optional)
Click "Install" when the toast notification appears

### Step 3: Grant Permissions
Allow Bluetooth, Camera, and Notifications when prompted

### Step 4: Create Profile
- Enter your name
- Take a live photo using your camera
- Click "Continue"

### Step 5: Discover Nearby Users
- Click the refresh button to scan for devices
- Nearby users running the app will appear in the list

### Step 6: Connect
- Click on a user to send a connection request
- Wait for them to accept
- Once connected, start chatting!

### Step 7: Chat
- Send real-time messages over Bluetooth
- Disconnect anytime using the disconnect button

### Step 8: Session End
When you close the app, all your data is automatically deleted:
- Your profile (name & photo)
- Chat history
- All connections

## Project Structure

```
Bluetooth proximity  cht/
├── index.html              # Main HTML structure
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker for offline support
├── app.js                  # Main application logic
├── styles.css              # All styling
├── icons/                  # PWA icons
│   ├── generate-icons.html # Icon generator utility
│   └── icon-*.png          # Generated icons
├── requirements.json       # Project requirements
├── test.json              # Test cases
└── README.md              # This file
```

## Technical Details

### PWA Features
- **Service Worker**: Caches resources for offline access
- **Web App Manifest**: Defines app metadata and install behavior
- **Install Prompt**: Custom toast notification for installation
- **Fullscreen Mode**: `display: fullscreen` in manifest

### Bluetooth Implementation
- **Web Bluetooth API**: For device discovery and connection
- **BLE GATT Services**: For data transfer
- **Custom Service UUID**: (to be implemented for production)

### Data Storage
- **In-Memory Only**: Uses JavaScript objects/Maps
- **No LocalStorage**: Nothing persisted to disk
- **No IndexedDB**: No database storage
- **SessionStorage**: Not used to ensure no persistence

### Camera Integration
- **MediaDevices API**: `getUserMedia()` for camera access
- **Canvas API**: For photo capture
- **Data URLs**: For temporary photo storage

## Known Limitations

1. **Web Bluetooth Limitations**:
   - iOS Safari does not support Web Bluetooth API
   - Requires user interaction to initiate scanning
   - Limited range (typical Bluetooth: ~10-100 meters)

2. **Browser Compatibility**:
   - Only works in Chromium-based browsers
   - Desktop and Android supported
   - iOS users cannot use the app currently

3. **Connection Stability**:
   - Depends on Bluetooth signal strength
   - May drop in crowded areas or with obstacles

4. **Data Transfer Speed**:
   - Slower than internet-based chat
   - Best for text messages, not large files

## Development Notes

### Current Implementation
The current version includes:
- ✅ Complete UI/UX
- ✅ Camera integration
- ✅ PWA installation
- ✅ Basic Bluetooth discovery
- ⚠️ **Simulated messaging** (for demo purposes)

### For Production
To make this fully functional for production:

1. **Implement Custom BLE Service**:
   ```javascript
   const SERVICE_UUID = 'your-custom-uuid';
   const CHARACTERISTIC_UUID = 'your-characteristic-uuid';
   ```

2. **Add Proper Message Protocol**:
   - Define message structure
   - Implement encryption
   - Handle connection state

3. **Add Real Bluetooth Communication**:
   - Replace simulated functions with actual BLE read/write
   - Implement proper device pairing
   - Handle multiple simultaneous connections

4. **Test on Physical Devices**:
   - Multiple phones/tablets
   - Different proximity ranges
   - Various environmental conditions

## Testing

See `test.json` for complete list of 71 test cases covering:
- PWA Installation
- Permissions
- Profile Setup
- Bluetooth Discovery
- Connection Requests
- Chat Functionality
- Data Persistence
- Browser Compatibility
- Performance
- Security

## Privacy & Security

- **Zero Tracking**: No analytics or telemetry
- **No Servers**: All communication is peer-to-peer via Bluetooth
- **Temporary Sessions**: All data deleted on app close
- **Local Only**: No data leaves your device except via Bluetooth
- **Mutual Consent**: Both users must approve connections

## Troubleshooting

### "Web Bluetooth not supported"
- Use Chrome, Edge, or Opera
- Make sure you're on Desktop or Android (not iOS)

### "Camera access denied"
- Check browser permissions
- Ensure HTTPS is being used
- Try different browser

### "No devices found"
- Make sure Bluetooth is enabled
- Ensure other device is also running the app
- Check proximity (stay within Bluetooth range)

### Install prompt not showing
- Must be served over HTTPS
- Service worker must be registered
- Browser must support PWA installation

## Future Enhancements

Potential features for future versions:
- Group chat support
- File/image sharing over Bluetooth
- Voice messages
- Better error handling
- Improved connection stability
- Background Bluetooth scanning
- Push notifications for connection requests

## License

This project is open source and available for educational purposes.

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## Credits

Built with:
- Web Bluetooth API
- MediaDevices API
- Service Workers
- Progressive Web App standards

---

**Note**: This is a proof-of-concept application. For production use, implement proper BLE services, encryption, and extensive testing on physical devices.

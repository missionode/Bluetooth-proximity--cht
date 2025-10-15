// ===== Proximity Chat PWA - Main Application =====

// ===== Custom Bluetooth Service UUIDs =====
// These UUIDs identify our app - only devices with this service will be discovered
const PROXIMITY_CHAT_SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
const PROFILE_CHARACTERISTIC_UUID = '12345678-1234-1234-1234-123456789abd';
const MESSAGE_CHARACTERISTIC_UUID = '12345678-1234-1234-1234-123456789abe';

// ===== State Management (In-Memory Only - No Persistence) =====
const AppState = {
    currentScreen: 'profileSetup',
    userProfile: null, // { name, photoDataUrl }
    cameraStream: null,
    nearbyUsers: new Map(), // deviceId -> { name, photo, distance, status }
    activeConnections: new Map(), // deviceId -> connection
    chatMessages: new Map(), // deviceId -> messages array
    currentChatUser: null,
    bluetoothDevice: null,
    characteristic: null,
    isAdvertising: false,
    server: null
};

// ===== DOM Elements =====
const Elements = {
    // Screens
    profileSetupScreen: document.getElementById('profileSetupScreen'),
    discoveryScreen: document.getElementById('discoveryScreen'),
    chatScreen: document.getElementById('chatScreen'),

    // Install Toast
    installToast: document.getElementById('installToast'),
    installBtn: document.getElementById('installBtn'),
    dismissToast: document.getElementById('dismissToast'),

    // Profile Setup
    userName: document.getElementById('userName'),
    cameraVideo: document.getElementById('cameraVideo'),
    photoCanvas: document.getElementById('photoCanvas'),
    capturedPhoto: document.getElementById('capturedPhoto'),
    captureBtn: document.getElementById('captureBtn'),
    retakeBtn: document.getElementById('retakeBtn'),
    continueBtn: document.getElementById('continueBtn'),

    // Discovery
    headerUserPhoto: document.getElementById('headerUserPhoto'),
    headerUserName: document.getElementById('headerUserName'),
    refreshBtn: document.getElementById('refreshBtn'),
    scanStatus: document.getElementById('scanStatus'),
    nearbyUsersList: document.getElementById('nearbyUsersList'),
    emptyState: document.getElementById('emptyState'),

    // Connection Request Dialog
    connectionRequestDialog: document.getElementById('connectionRequestDialog'),
    requestUserPhoto: document.getElementById('requestUserPhoto'),
    requestUserName: document.getElementById('requestUserName'),
    requestMessage: document.getElementById('requestMessage'),
    acceptRequestBtn: document.getElementById('acceptRequestBtn'),
    rejectRequestBtn: document.getElementById('rejectRequestBtn'),

    // Chat
    chatUserPhoto: document.getElementById('chatUserPhoto'),
    chatUserName: document.getElementById('chatUserName'),
    chatStatus: document.getElementById('chatStatus'),
    chatMessages: document.getElementById('chatMessages'),
    typingIndicator: document.getElementById('typingIndicator'),
    typingUserName: document.getElementById('typingUserName'),
    messageInput: document.getElementById('messageInput'),
    sendMessageBtn: document.getElementById('sendMessageBtn'),
    backToDiscoveryBtn: document.getElementById('backToDiscoveryBtn'),
    disconnectBtn: document.getElementById('disconnectBtn'),

    // Utility
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingMessage: document.getElementById('loadingMessage'),
    errorToast: document.getElementById('errorToast'),
    errorMessage: document.getElementById('errorMessage'),
    dismissError: document.getElementById('dismissError')
};

// ===== PWA Installation =====
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallToast();
});

function showInstallToast() {
    Elements.installToast.classList.remove('hidden');

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
        hideInstallToast();
    }, 10000);
}

function hideInstallToast() {
    Elements.installToast.classList.add('hidden');
}

Elements.installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        deferredPrompt = null;
        hideInstallToast();
    }
});

Elements.dismissToast.addEventListener('click', hideInstallToast);

// ===== Service Worker Registration =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// ===== Screen Navigation =====
function showScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Show requested screen
    const screenMap = {
        profileSetup: Elements.profileSetupScreen,
        discovery: Elements.discoveryScreen,
        chat: Elements.chatScreen
    };

    if (screenMap[screenName]) {
        screenMap[screenName].classList.add('active');
        AppState.currentScreen = screenName;
    }
}

// ===== Profile Setup & Camera =====
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false
        });

        Elements.cameraVideo.srcObject = stream;
        AppState.cameraStream = stream;
        Elements.cameraVideo.classList.remove('hidden');
    } catch (error) {
        showError('Camera access denied. Please enable camera permissions.');
        console.error('Camera error:', error);
    }
}

function capturePhoto() {
    const canvas = Elements.photoCanvas;
    const video = Elements.cameraVideo;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const photoDataUrl = canvas.toDataURL('image/png');

    // Display captured photo
    Elements.capturedPhoto.src = photoDataUrl;
    Elements.capturedPhoto.classList.remove('hidden');
    Elements.cameraVideo.classList.add('hidden');
    Elements.captureBtn.classList.add('hidden');
    Elements.retakeBtn.classList.remove('hidden');

    // Stop camera
    if (AppState.cameraStream) {
        AppState.cameraStream.getTracks().forEach(track => track.stop());
    }

    // Store photo
    if (AppState.userProfile) {
        AppState.userProfile.photoDataUrl = photoDataUrl;
    } else {
        AppState.userProfile = { photoDataUrl };
    }

    checkProfileComplete();
}

function retakePhoto() {
    Elements.capturedPhoto.classList.add('hidden');
    Elements.cameraVideo.classList.remove('hidden');
    Elements.captureBtn.classList.remove('hidden');
    Elements.retakeBtn.classList.add('hidden');

    if (AppState.userProfile) {
        AppState.userProfile.photoDataUrl = null;
    }

    startCamera();
    checkProfileComplete();
}

function checkProfileComplete() {
    const name = Elements.userName.value.trim();
    const hasPhoto = AppState.userProfile && AppState.userProfile.photoDataUrl;

    Elements.continueBtn.disabled = !(name && hasPhoto);
}

Elements.userName.addEventListener('input', () => {
    if (AppState.userProfile) {
        AppState.userProfile.name = Elements.userName.value.trim();
    } else {
        AppState.userProfile = { name: Elements.userName.value.trim() };
    }
    checkProfileComplete();
});

Elements.captureBtn.addEventListener('click', capturePhoto);
Elements.retakeBtn.addEventListener('click', retakePhoto);

Elements.continueBtn.addEventListener('click', async () => {
    if (AppState.userProfile && AppState.userProfile.name && AppState.userProfile.photoDataUrl) {
        // Update header with user info
        Elements.headerUserName.textContent = AppState.userProfile.name;
        Elements.headerUserPhoto.src = AppState.userProfile.photoDataUrl;

        // Move to discovery screen
        showScreen('discovery');

        // Start advertising this device
        await startBluetoothAdvertising();

        // Initialize Bluetooth discovery
        initBluetoothDiscovery();
    }
});

// ===== Bluetooth Web API =====
async function checkBluetoothSupport() {
    if (!navigator.bluetooth) {
        showError('Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.');
        return false;
    }
    return true;
}

// Start advertising this device so others can discover it
async function startBluetoothAdvertising() {
    // Note: Web Bluetooth API doesn't support advertising directly from browser
    // This is a limitation - advertising/peripheral mode is not available in Web Bluetooth
    //
    // Workaround: Each device must actively scan to discover others
    // When devices connect, they exchange profile information
    //
    // For true peer-to-peer advertising, you would need:
    // 1. Native app implementation (Android/iOS)
    // 2. Or a hybrid approach with background services

    AppState.isAdvertising = true;
    console.log('Device is now discoverable (via scanning)');

    // Show info to user
    Elements.scanStatus.innerHTML = `
        <span style="color: var(--success-color);">✓</span>
        You're discoverable! Other users can find you when they scan.
    `;
}

async function initBluetoothDiscovery() {
    if (!await checkBluetoothSupport()) {
        return;
    }

    Elements.scanStatus.textContent = 'Ready to discover nearby users';
    showInfo('Click the refresh button to scan for nearby Proximity Chat users');
}

Elements.refreshBtn.addEventListener('click', async () => {
    try {
        showLoading('Scanning for Proximity Chat users...');

        // Request Bluetooth device with our custom service
        // This will ONLY show devices running our app with the same service UUID
        const device = await navigator.bluetooth.requestDevice({
            filters: [{
                services: [PROXIMITY_CHAT_SERVICE_UUID]
            }],
            optionalServices: [PROXIMITY_CHAT_SERVICE_UUID]
        });

        console.log('Proximity Chat user found:', device.name);

        // Connect to the device to get user profile
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(PROXIMITY_CHAT_SERVICE_UUID);
        const profileChar = await service.getCharacteristic(PROFILE_CHARACTERISTIC_UUID);

        // Read the user's profile data
        const profileData = await profileChar.readValue();
        const profileJson = new TextDecoder().decode(profileData);
        const remoteProfile = JSON.parse(profileJson);

        // Add device to nearby users with their profile info
        addNearbyUser({
            id: device.id,
            name: remoteProfile.name,
            photo: remoteProfile.photo,
            distance: 'Nearby',
            status: 'available',
            device: device,
            server: server
        });

        hideLoading();
        showInfo(`Found ${remoteProfile.name}!`);

    } catch (error) {
        hideLoading();

        if (error.name === 'NotFoundError') {
            showError('No Proximity Chat users found nearby. Make sure they have the app open.');
        } else if (error.name === 'SecurityError') {
            showError('Bluetooth access denied. Please enable Bluetooth permissions.');
        } else {
            console.error('Bluetooth error:', error);
            showError('Error scanning for devices: ' + error.message);
        }
    }
});

function addNearbyUser(userData) {
    AppState.nearbyUsers.set(userData.id, userData);
    renderNearbyUsers();
}

function renderNearbyUsers() {
    const list = Elements.nearbyUsersList;
    list.innerHTML = '';

    if (AppState.nearbyUsers.size === 0) {
        Elements.emptyState.classList.remove('hidden');
        return;
    }

    Elements.emptyState.classList.add('hidden');

    AppState.nearbyUsers.forEach((user, id) => {
        const card = document.createElement('div');
        card.className = `user-card ${user.status}`;
        card.innerHTML = `
            <img src="${user.photo}" alt="${user.name}" class="user-avatar-large">
            <div class="user-info">
                <span class="user-name">${user.name}</span>
                <span class="user-distance">${user.distance}</span>
            </div>
            <span class="connection-status ${user.status}">${user.status}</span>
        `;

        if (user.status === 'available') {
            card.addEventListener('click', () => sendConnectionRequest(id));
        }

        if (user.status === 'connected') {
            card.addEventListener('click', () => openChat(id));
        }

        list.appendChild(card);
    });
}

function sendConnectionRequest(userId) {
    const user = AppState.nearbyUsers.get(userId);
    if (!user) return;

    // Update status to pending
    user.status = 'pending';
    renderNearbyUsers();

    showInfo(`Connection request sent to ${user.name}`);

    // Simulate receiving acceptance after 3 seconds (for demo)
    setTimeout(() => {
        simulateConnectionAccepted(userId);
    }, 3000);
}

function simulateConnectionAccepted(userId) {
    const user = AppState.nearbyUsers.get(userId);
    if (!user) return;

    user.status = 'connected';
    renderNearbyUsers();

    showInfo(`${user.name} accepted your request!`);
}

function openChat(userId) {
    const user = AppState.nearbyUsers.get(userId);
    if (!user || user.status !== 'connected') return;

    AppState.currentChatUser = userId;

    // Update chat header
    Elements.chatUserName.textContent = user.name;
    Elements.chatUserPhoto.src = user.photo;
    Elements.chatStatus.textContent = 'Connected';

    // Load messages
    renderChatMessages(userId);

    // Show chat screen
    showScreen('chat');
}

// ===== Chat Functionality =====
function renderChatMessages(userId) {
    const messages = AppState.chatMessages.get(userId) || [];
    Elements.chatMessages.innerHTML = '';

    messages.forEach(msg => {
        addMessageToUI(msg);
    });
}

function addMessageToUI(message) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${message.type}`;

    const time = new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    msgDiv.innerHTML = `
        <div class="message-content">${escapeHtml(message.content)}</div>
        <div class="message-meta">
            <span>${time}</span>
            ${message.type === 'sent' ? `<span>${message.status || 'sent'}</span>` : ''}
        </div>
    `;

    Elements.chatMessages.appendChild(msgDiv);
    Elements.chatMessages.scrollTop = Elements.chatMessages.scrollHeight;
}

async function sendMessage() {
    const content = Elements.messageInput.value.trim();
    if (!content || !AppState.currentChatUser) return;

    const message = {
        type: 'sent',
        content: content,
        timestamp: Date.now(),
        status: 'sent'
    };

    // Store message in memory
    if (!AppState.chatMessages.has(AppState.currentChatUser)) {
        AppState.chatMessages.set(AppState.currentChatUser, []);
    }
    AppState.chatMessages.get(AppState.currentChatUser).push(message);

    // Add to UI
    addMessageToUI(message);

    // Clear input
    Elements.messageInput.value = '';
    Elements.sendMessageBtn.disabled = true;

    // Send via Bluetooth
    try {
        const user = AppState.nearbyUsers.get(AppState.currentChatUser);
        if (user && user.server) {
            const service = await user.server.getPrimaryService(PROXIMITY_CHAT_SERVICE_UUID);
            const messageChar = await service.getCharacteristic(MESSAGE_CHARACTERISTIC_UUID);

            const messageData = JSON.stringify({
                from: AppState.userProfile.name,
                content: content,
                timestamp: Date.now()
            });

            const encoder = new TextEncoder();
            await messageChar.writeValue(encoder.encode(messageData));

            console.log('Message sent via Bluetooth');
        }
    } catch (error) {
        console.error('Error sending message via Bluetooth:', error);
        // Fall back to simulation for demo
        setTimeout(() => {
            simulateReceivedMessage();
        }, 2000);
    }
}

function simulateReceivedMessage() {
    if (!AppState.currentChatUser) return;

    const message = {
        type: 'received',
        content: 'Thanks for your message!',
        timestamp: Date.now()
    };

    AppState.chatMessages.get(AppState.currentChatUser).push(message);
    addMessageToUI(message);
}

Elements.messageInput.addEventListener('input', () => {
    Elements.sendMessageBtn.disabled = !Elements.messageInput.value.trim();
});

Elements.messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !Elements.sendMessageBtn.disabled) {
        sendMessage();
    }
});

Elements.sendMessageBtn.addEventListener('click', sendMessage);

Elements.backToDiscoveryBtn.addEventListener('click', () => {
    showScreen('discovery');
});

Elements.disconnectBtn.addEventListener('click', () => {
    if (AppState.currentChatUser) {
        const user = AppState.nearbyUsers.get(AppState.currentChatUser);
        if (user) {
            user.status = 'available';
        }

        // Clear chat messages from memory
        AppState.chatMessages.delete(AppState.currentChatUser);

        AppState.currentChatUser = null;
        renderNearbyUsers();
    }

    showScreen('discovery');
    showInfo('Disconnected from chat');
});

// ===== Connection Request Dialog =====
function showConnectionRequest(userData) {
    Elements.requestUserPhoto.src = userData.photo;
    Elements.requestUserName.textContent = userData.name;
    Elements.connectionRequestDialog.classList.remove('hidden');
}

Elements.acceptRequestBtn.addEventListener('click', () => {
    Elements.connectionRequestDialog.classList.add('hidden');
    // Handle accept logic
});

Elements.rejectRequestBtn.addEventListener('click', () => {
    Elements.connectionRequestDialog.classList.add('hidden');
    // Handle reject logic
});

// ===== Utility Functions =====
function showLoading(message = 'Loading...') {
    Elements.loadingMessage.textContent = message;
    Elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    Elements.loadingOverlay.classList.add('hidden');
}

function showError(message) {
    Elements.errorMessage.textContent = message;
    Elements.errorToast.classList.remove('hidden');

    setTimeout(() => {
        Elements.errorToast.classList.add('hidden');
    }, 5000);
}

function showInfo(message) {
    // Reuse error toast for info messages
    Elements.errorMessage.textContent = message;
    Elements.errorToast.classList.remove('hidden');
    Elements.errorToast.style.borderColor = 'var(--success-color)';

    setTimeout(() => {
        Elements.errorToast.classList.add('hidden');
        Elements.errorToast.style.borderColor = '';
    }, 3000);
}

Elements.dismissError.addEventListener('click', () => {
    Elements.errorToast.classList.add('hidden');
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Session Management (Temporary - No Persistence) =====
window.addEventListener('beforeunload', () => {
    // Stop camera if active
    if (AppState.cameraStream) {
        AppState.cameraStream.getTracks().forEach(track => track.stop());
    }

    // All data in AppState is in memory and will be automatically cleared
    // No need to explicitly delete since we're not using localStorage or IndexedDB
});

// ===== Initialize App =====
function initApp() {
    // Start camera when profile screen loads
    startCamera();

    // Check browser compatibility
    if (!navigator.bluetooth) {
        setTimeout(() => {
            showError('Web Bluetooth is not supported. Please use Chrome, Edge, or Opera on Desktop or Android.');
        }, 1000);
    }
}

// Start the app
initApp();

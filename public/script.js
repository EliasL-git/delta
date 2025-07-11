// Discord-like Chat Application JavaScript
const socket = io();

// DOM Elements
const usernameModal = document.getElementById('usernameModal');
const usernameInput = document.getElementById('usernameInput');
const joinButton = document.getElementById('joinButton');
const messageInput = document.getElementById('messageInput');
const messagesContainer = document.getElementById('messagesContainer');
const typingIndicator = document.getElementById('typingIndicator');
const typingText = document.getElementById('typingText');
const memberCount = document.getElementById('memberCount');
const onlineCount = document.getElementById('onlineCount');
const onlineMembers = document.getElementById('onlineMembers');
const displayUsername = document.getElementById('displayUsername');
const userInitial = document.getElementById('userInitial');
const currentChannelName = document.getElementById('currentChannelName');
const channelTopic = document.getElementById('channelTopic');
const welcomeChannelName = document.getElementById('welcomeChannelName');
const welcomeChannelName2 = document.getElementById('welcomeChannelName2');
const membersToggle = document.getElementById('membersToggle');
const membersSidebar = document.getElementById('membersSidebar');

// Application state
let currentUser = null;
let currentChannel = 'general';
let onlineUsers = new Set();
let typingUsers = new Set();
let typingTimeout = null;

// Channel configuration
const channels = {
    'general': {
        name: 'general',
        topic: 'Welcome to Delta! A Discord-like chat experience.'
    },
    'random': {
        name: 'random',
        topic: 'Random discussions and off-topic conversations.'
    },
    'tech-talk': {
        name: 'tech-talk',
        topic: 'Discuss technology, programming, and development.'
    }
};

// User colors for avatars
const userColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #ff8a80 0%, #ea80fc 100%)'
];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM Content Loaded - Initializing application');
    console.log('Elements found:');
    console.log('- usernameModal:', !!usernameModal);
    console.log('- usernameInput:', !!usernameInput);
    console.log('- joinButton:', !!joinButton);
    
    initializeEventListeners();
    showUsernameModal();
    console.log('✅ Application initialized');
});

function initializeEventListeners() {
    console.log('🔧 Initializing event listeners');
    
    // Username modal events
    if (usernameInput) {
        usernameInput.addEventListener('input', validateUsername);
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !joinButton.disabled) {
                console.log('Enter key pressed - joining chat');
                joinChat();
            }
        });
        console.log('✅ Username input listeners added');
    } else {
        console.error('❌ usernameInput element not found');
    }
    
    if (joinButton) {
        joinButton.addEventListener('click', () => {
            console.log('Join button clicked');
            joinChat();
        });
        console.log('✅ Join button listener added');
    } else {
        console.error('❌ joinButton element not found');
    }

    // Message input events
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });

    messageInput.addEventListener('input', handleTyping);

    // Channel switching
    document.querySelectorAll('.channel-item[data-channel]').forEach(item => {
        item.addEventListener('click', () => {
            const channelName = item.dataset.channel;
            if (channelName !== currentChannel) {
                switchChannel(channelName);
            }
        });
    });

    // Members sidebar toggle
    membersToggle.addEventListener('click', toggleMembersSidebar);

    // User control buttons
    document.getElementById('muteBtn').addEventListener('click', () => {
        showToast('Mute/Unmute functionality would be implemented here');
    });

    document.getElementById('deafenBtn').addEventListener('click', () => {
        showToast('Deafen/Undeafen functionality would be implemented here');
    });

    document.getElementById('settingsBtn').addEventListener('click', () => {
        showToast('Settings panel would be implemented here');
    });
}

function showUsernameModal() {
    console.log('🔍 showUsernameModal() called');
    console.log('Modal element:', usernameModal);
    console.log('Modal current display style:', usernameModal ? usernameModal.style.display : 'element not found');
    
    if (usernameModal) {
        usernameModal.style.display = 'flex';
        console.log('✅ Modal display set to flex');
        
        if (usernameInput) {
            usernameInput.focus();
            console.log('✅ Username input focused');
        } else {
            console.error('❌ usernameInput element not found');
        }
    } else {
        console.error('❌ usernameModal element not found');
    }
}

function hideUsernameModal() {
    usernameModal.style.display = 'none';
}

function validateUsername() {
    console.log('validateUsername() called');
    const username = usernameInput.value.trim();
    console.log('Username value:', username, 'Length:', username.length);
    const isValid = username.length >= 2 && username.length <= 20 && /^[a-zA-Z0-9_-]+$/.test(username);
    console.log('Username is valid:', isValid);
    joinButton.disabled = !isValid;
    console.log('Join button disabled:', joinButton.disabled);
}

function joinChat() {
    console.log('joinChat() called');
    const username = usernameInput.value.trim();
    console.log('Username:', username, 'Button disabled:', joinButton.disabled);
    
    if (username && !joinButton.disabled) {
        console.log('Creating user object...');
        currentUser = {
            username: username,
            id: generateUserId(),
            color: userColors[Math.floor(Math.random() * userColors.length)],
            discriminator: Math.floor(Math.random() * 9999).toString().padStart(4, '0')
        };

        console.log('Current user created:', currentUser);

        // Update UI with user info
        displayUsername.textContent = username;
        userInitial.textContent = username.charAt(0).toUpperCase();
        document.querySelector('.user-status').textContent = `#${currentUser.discriminator}`;

        console.log('Emitting user-join event...');
        // Join the socket room
        socket.emit('user-join', {
            username: username,
            channel: currentChannel,
            ...currentUser
        });

        console.log('Hiding modal...');
        hideUsernameModal();
        updateChannelInfo();
        console.log('joinChat() completed successfully');
    } else {
        console.log('Cannot join - invalid username or button disabled');
    }
}

function generateUserId() {
    return Math.random().toString(36).substr(2, 9);
}

function switchChannel(channelName) {
    if (!channels[channelName]) return;

    // Leave current channel
    socket.emit('leave-channel', currentChannel);

    // Update current channel
    currentChannel = channelName;

    // Clear messages
    messagesContainer.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon">🔺</div>
            <h2>Welcome to #${channelName}!</h2>
            <p>This is the beginning of the #${channelName} channel.</p>
        </div>
    `;

    // Update UI
    updateChannelInfo();
    updateActiveChannel();

    // Join new channel
    if (currentUser) {
        socket.emit('user-join', {
            ...currentUser,
            channel: channelName
        });
    }
}

function updateChannelInfo() {
    const channel = channels[currentChannel];
    currentChannelName.textContent = channel.name;
    channelTopic.textContent = channel.topic;
    welcomeChannelName.textContent = channel.name;
    welcomeChannelName2.textContent = channel.name;
    messageInput.placeholder = `Message #${channel.name}`;
}

function updateActiveChannel() {
    document.querySelectorAll('.channel-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeChannel = document.querySelector(`[data-channel="${currentChannel}"]`);
    if (activeChannel) {
        activeChannel.classList.add('active');
    }
}

function sendMessage() {
    const content = messageInput.value.trim();
    if (content && currentUser) {
        const message = {
            id: Date.now(),
            username: currentUser.username,
            content: content,
            timestamp: new Date(),
            channel: currentChannel,
            userId: currentUser.id,
            color: currentUser.color
        };

        socket.emit('message', message);
        messageInput.value = '';
        
        // Stop typing indicator
        socket.emit('stop-typing', currentChannel);
        clearTimeout(typingTimeout);
    }
}

function handleTyping() {
    if (!currentUser) return;

    socket.emit('typing', {
        username: currentUser.username,
        channel: currentChannel
    });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('stop-typing', currentChannel);
    }, 3000);
}

function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    
    const isOwnMessage = currentUser && message.userId === currentUser.id;
    const timestamp = new Date(message.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    messageElement.innerHTML = `
        <div class="message-avatar" style="background: ${message.color || userColors[0]}">
            ${message.username.charAt(0).toUpperCase()}
        </div>
        <div class="message-content-wrapper">
            <div class="message-header">
                <span class="message-username" style="color: ${isOwnMessage ? '#43b581' : '#dcddde'}">${message.username}</span>
                <span class="message-timestamp">${timestamp}</span>
            </div>
            <div class="message-content">${escapeHtml(message.content)}</div>
        </div>
    `;

    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

function updateOnlineUsers(users) {
    onlineUsers = new Set(users);
    memberCount.textContent = users.length;
    onlineCount.textContent = users.length;

    // Update members list
    onlineMembers.innerHTML = '';
    users.forEach(user => {
        const memberElement = document.createElement('div');
        memberElement.className = 'member-item';
        memberElement.innerHTML = `
            <div class="member-avatar" style="background: ${user.color || userColors[0]}">
                ${user.username.charAt(0).toUpperCase()}
                <div class="status-indicator online"></div>
            </div>
            <span class="member-name">${user.username}</span>
        `;
        onlineMembers.appendChild(memberElement);
    });
}

function updateTypingIndicator(users) {
    typingUsers = new Set(users.filter(u => currentUser && u !== currentUser.username));
    
    if (typingUsers.size === 0) {
        typingIndicator.style.display = 'none';
        return;
    }

    const typingArray = Array.from(typingUsers);
    let typingText = '';
    
    if (typingArray.length === 1) {
        typingText = `${typingArray[0]} is typing...`;
    } else if (typingArray.length === 2) {
        typingText = `${typingArray[0]} and ${typingArray[1]} are typing...`;
    } else {
        typingText = `${typingArray.length} people are typing...`;
    }

    document.getElementById('typingText').textContent = typingText;
    typingIndicator.style.display = 'flex';
}

function toggleMembersSidebar() {
    membersSidebar.classList.toggle('visible');
}

function showToast(message) {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--background-floating);
        color: var(--text-normal);
        padding: 12px 16px;
        border-radius: 4px;
        z-index: 10001;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Socket event listeners
socket.on('user-joined', (data) => {
    if (data.channel === currentChannel) {
        showToast(`${data.username} joined the channel`);
    }
});

socket.on('user-left', (data) => {
    if (data.channel === currentChannel) {
        showToast(`${data.username} left the channel`);
    }
});

socket.on('message', (message) => {
    if (message.channel === currentChannel) {
        displayMessage(message);
    }
});

socket.on('users-update', (data) => {
    if (data.channel === currentChannel) {
        updateOnlineUsers(data.users);
    }
});

socket.on('typing-update', (data) => {
    if (data.channel === currentChannel) {
        updateTypingIndicator(data.users);
    }
});

socket.on('connect', () => {
    console.log('✅ Connected to server');
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
    showToast('Disconnected from server. Attempting to reconnect...');
});

socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
});

socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error);
});

socket.on('reconnect', () => {
    console.log('Reconnected to server');
    showToast('Reconnected to server');
    
    // Rejoin current channel if user exists
    if (currentUser) {
        socket.emit('user-join', {
            ...currentUser,
            channel: currentChannel
        });
    }
});

// Add some CSS for toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .toast {
        box-shadow: var(--elevation-high);
        border: 1px solid var(--background-modifier-accent);
    }
`;
document.head.appendChild(style);

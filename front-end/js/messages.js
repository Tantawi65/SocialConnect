/* ==========================================================================
   Messages Module
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // Only run this code if we are on the messages page
    if (!window.location.pathname.includes('messages.html') && !document.getElementById('messages-area')) {
        return;
    }

    // --- State Variables ---
    let currentUser = null;
    let activeConversation = null;
    let messageCounter = 0;

    // --- Initialization ---
    initMessagesPage();

    function initMessagesPage() {
        console.log('Initializing messages page...');
        
        // 1. Load User (Simple local storage or default)
        const storedUser = localStorage.getItem('user');
        currentUser = storedUser ? JSON.parse(storedUser) : { 
            name: 'Demo User', 
            avatar: 'images/default-avatar.jpg' 
        };

        // 2. Setup UI
        updateUserInterface();
        loadConversations();
        setupMessageInput();
        setupSearch();
        setupFileUpload();
        setupMobileMenu();
    }

    // --- Helper Functions (Replacements for the old .format library) ---
    function formatTime(date) {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " mins ago";
        return "Just now";
    }

    // --- UI Functions ---
    function updateUserInterface() {
        const userAvatars = document.querySelectorAll('.user-avatar');
        const userNames = document.querySelectorAll('.user-name');
        
        userAvatars.forEach(img => {
            img.src = currentUser.avatar;
            img.alt = currentUser.name;
        });
        
        userNames.forEach(span => {
            span.textContent = currentUser.name;
        });
    }

    function loadConversations() {
        const conversationsList = document.querySelector('.conversations-list');
        if (!conversationsList) return;

        // Static sample data
        const conversations = [
            {
                id: 'conv-1',
                name: 'Shehab',
                avatar: 'images/default-avatar.jpg',
                lastMessage: 'Hey! How are you doing?',
                timestamp: new Date(Date.now() - 30 * 60 * 1000),
                unread: 2,
                online: true
            },
            {
                id: 'conv-2',
                name: 'Brad Bitt',
                avatar: 'images/default-avatar.jpg',
                lastMessage: 'Thanks for sharing that article!',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                unread: 0,
                online: false
            },
            {
                id: 'conv-3',
                name: 'Robert D Junior',
                avatar: 'images/default-avatar.jpg',
                lastMessage: 'See you at the meeting tomorrow',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
                unread: 1,
                online: true
            },
            {
                id: 'conv-4',
                name: 'Raphinha',
                avatar: 'images/default-avatar.jpg',
                lastMessage: 'Great job on the presentation!',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
                unread: 0,
                online: false
            }
        ];

        conversationsList.innerHTML = '';
        
        conversations.forEach(function(conversation) {
            const item = createConversationElement(conversation);
            conversationsList.appendChild(item);
        });

        // Load first conversation by default
        if (conversations.length > 0) {
            loadConversation(conversations[0]);
            // Highlight the first item visually
            const firstItem = conversationsList.firstElementChild;
            if(firstItem) setActiveConversation(firstItem);
        }
    }

    function createConversationElement(conversation) {
        const timeAgo = formatTimeAgo(conversation.timestamp);
        const unreadBadge = conversation.unread > 0 ? `<span class="unread-badge">${conversation.unread}</span>` : '';
        const onlineIndicator = conversation.online ? '<span class="online-indicator"></span>' : '';

        const div = document.createElement('div');
        div.className = 'conversation-item';
        div.setAttribute('data-conversation-id', conversation.id);
        
        div.innerHTML = `
            <div class="conversation-avatar">
                <img src="${conversation.avatar}" alt="${conversation.name}" class="avatar-img">
                ${onlineIndicator}
            </div>
            <div class="conversation-content">
                <div class="conversation-header">
                    <h4 class="conversation-name">${conversation.name}</h4>
                    <span class="conversation-time">${timeAgo}</span>
                </div>
                <p class="last-message">${conversation.lastMessage}</p>
                ${unreadBadge}
            </div>
        `;

        div.addEventListener('click', function() {
            loadConversation(conversation);
            setActiveConversation(div);
        });

        return div;
    }

    function setActiveConversation(element) {
        // Remove active class from all
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add to current
        element.classList.add('active');
        
        // clear unread badge if exists
        const badge = element.querySelector('.unread-badge');
        if (badge) badge.remove();
    }

    function loadConversation(conversation) {
        activeConversation = conversation;

        // Toggle Views
        const noConversation = document.getElementById('no-conversation');
        const activeChat = document.getElementById('active-chat');

        if (noConversation) noConversation.classList.add('hidden');
        if (activeChat) activeChat.classList.remove('hidden');

        // Update Header
        const chatName = document.querySelector('.chat-user-name');
        const chatAvatar = document.querySelector('.chat-avatar');
        const chatStatus = document.querySelector('.chat-user-status');

        if (chatName) chatName.textContent = conversation.name;
        if (chatAvatar) {
            chatAvatar.src = conversation.avatar;
            chatAvatar.alt = conversation.name;
        }
        if (chatStatus) {
            chatStatus.textContent = conversation.online ? 'Active now' : 'Last seen recently';
            chatStatus.className = 'chat-user-status ' + (conversation.online ? 'online' : 'offline');
        }

        loadMessages(conversation.id);
    }

    function loadMessages(conversationId) {
        let messagesList = document.querySelector('.messages-list');
        const messagesArea = document.getElementById('messages-area');

        if (!messagesList && messagesArea) {
            messagesList = document.createElement('div');
            messagesList.className = 'messages-list';
            messagesArea.appendChild(messagesList);
        }

        if (!messagesList) return;

        // Reset list
        messagesList.innerHTML = '<div class="date-divider"><span class="date-text">Today</span></div>';

        const messages = generateSampleMessages(conversationId);
        messages.forEach(msg => {
            messagesList.appendChild(createMessageElement(msg));
        });

        scrollToBottom();
    }

    function generateSampleMessages(conversationId) {
        // Simple hardcoded map for demo purposes
        const data = {
            'conv-1': [
                { sender: 'Alice Johnson', content: 'Hey! How are you doing?', timestamp: new Date(Date.now() - 35 * 60 * 1000), isOwn: false },
                { sender: currentUser.name, content: 'Hi Shehab! I\'m doing great. How about you?', timestamp: new Date(Date.now() - 30 * 60 * 1000), isOwn: true },
                { sender: 'Alice Johnson', content: 'I\'m good too! Just finished a big project. 🎉', timestamp: new Date(Date.now() - 25 * 60 * 1000), isOwn: false },
                { sender: currentUser.name, content: 'That\'s awesome! Congratulations!', timestamp: new Date(Date.now() - 20 * 60 * 1000), isOwn: true }
            ],
            'conv-2': [
                { sender: currentUser.name, content: 'Found this interesting article.', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), isOwn: true },
                { sender: 'Bob Smith', content: 'Thanks for sharing!', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), isOwn: false }
            ],
            'conv-3': [
                { sender: 'Carol Brown', content: 'Meeting is at 2 PM', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), isOwn: false },
                { sender: currentUser.name, content: 'Got it.', timestamp: new Date(Date.now() - 4.5 * 60 * 60 * 1000), isOwn: true }
            ]
        };
        return data[conversationId] || [];
    }

    function createMessageElement(message) {
        const timeStr = formatTime(message.timestamp);
        
        const div = document.createElement('div');
        // Basic XSS protection: use textContent for user messages
        const contentText = message.content; 
        
        // Check if content is HTML (for images/files) or text
        const isHtmlContent = contentText.includes('<img') || contentText.includes('shared-file');
        
        if (message.isOwn) {
            div.innerHTML = `
                <div class="message sent">
                    <div class="message-content">
                        <div class="message-bubble">
                            <p>${isHtmlContent ? contentText : ''}</p>
                        </div>
                        <time class="message-time">${timeStr}</time>
                    </div>
                </div>`;
            // If text, inject safely
            if (!isHtmlContent) div.querySelector('p').textContent = contentText;
            
        } else {
            div.innerHTML = `
                <div class="message received">
                    <img src="images/default-avatar.jpg" alt="User" class="message-avatar" />
                    <div class="message-content">
                        <div class="message-bubble">
                            <p>${isHtmlContent ? contentText : ''}</p>
                        </div>
                        <time class="message-time">${timeStr}</time>
                    </div>
                </div>`;
            if (!isHtmlContent) div.querySelector('p').textContent = contentText;
        }

        return div.firstElementChild; // Return the inner .message div
    }

    function setupMessageInput() {
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-btn');

        if (!messageInput || !sendButton) return;

        // Auto-resize
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
            sendButton.disabled = this.value.trim().length === 0;
        });

        // Enter key
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sendButton.disabled) sendMessage();
            }
        });

        // Click Send
        sendButton.addEventListener('click', sendMessage);
    }

    function sendMessage() {
        const messageInput = document.getElementById('message-input');
        const content = messageInput.value.trim();

        if (content.length === 0 || !activeConversation) return;

        const message = {
            id: 'msg-' + (++messageCounter),
            sender: currentUser.name,
            content: content,
            timestamp: new Date(),
            isOwn: true
        };

        // Add to DOM
        const messagesList = document.querySelector('.messages-list');
        const msgEl = createMessageElement(message);
        messagesList.appendChild(msgEl);

        // Animation
        msgEl.classList.add('new');
        setTimeout(() => msgEl.classList.remove('new'), 300);

        // Cleanup Input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        document.getElementById('send-btn').disabled = true;

        scrollToBottom();
        updateConversationPreview(activeConversation.id, content);
    }



    function updateConversationPreview(id, text) {
        const item = document.querySelector(`.conversation-item[data-conversation-id="${id}"]`);
        if (item) {
            item.querySelector('.last-message').textContent = text;
            item.querySelector('.conversation-time').textContent = 'now';
            // Move to top
            item.parentNode.prepend(item);
        }
    }

    function scrollToBottom() {
        const area = document.getElementById('messages-area');
        if (area) area.scrollTop = area.scrollHeight;
    }

    function setupSearch() {
        const searchInput = document.getElementById('conversations-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', function() {
            const query = this.value.trim().toLowerCase();
            const items = document.querySelectorAll('.conversation-item');
            
            items.forEach(item => {
                const name = item.querySelector('.conversation-name').textContent.toLowerCase();
                const msg = item.querySelector('.last-message').textContent.toLowerCase();
                
                if (name.includes(query) || msg.includes(query)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    function setupFileUpload() {
        const attachBtn = document.getElementById('attach-button');
        const photoBtn = document.getElementById('photo-button');
        const fileInput = document.getElementById('file-input');

        if (!fileInput) return;

        if (attachBtn) {
            attachBtn.addEventListener('click', () => {
                fileInput.setAttribute('accept', '*/*');
                fileInput.click();
            });
        }
        
        if (photoBtn) {
            photoBtn.addEventListener('click', () => {
                fileInput.setAttribute('accept', 'image/*');
                fileInput.click();
            });
        }

        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            // Simple handling - just show message with icon
            // We removed the complex FileReader logic to make it simpler/cleaner as requested
            // but we'll still distinguish between image and generic file for the UI
            
            let contentHtml = '';
            
            if (file.type.startsWith('image/')) {
                 // For local demo, we can use URL.createObjectURL which is simpler than FileReader
                const imgUrl = URL.createObjectURL(file);
                contentHtml = `<img src="${imgUrl}" alt="Shared image" class="shared-image" style="
                    max-width: 100%;
                    max-height: 300px;
                    width: auto;
                    height: auto;
                    border-radius: 8px;
                    object-fit: cover;
                    cursor: pointer;
                    display: block;
                ">`;
                updateConversationPreview(activeConversation.id, '📷 Photo');
            } else {
                contentHtml = `<div class="shared-file"><span class="file-icon">📄</span><span class="file-name">${file.name}</span></div>`;
                updateConversationPreview(activeConversation.id, '📎 ' + file.name);
            }

            const message = {
                id: 'msg-file-' + (++messageCounter),
                sender: currentUser.name,
                content: contentHtml,
                timestamp: new Date(),
                isOwn: true
            };

            const list = document.querySelector('.messages-list');
            const messageEl = createMessageElement(message);
            list.appendChild(messageEl);
            
            // Add click handler for images to view full size
            if (file.type.startsWith('image/')) {
                const img = messageEl.querySelector('.shared-image');
                if (img) {
                    img.addEventListener('click', () => {
                        openImageModal(img.src);
                    });
                }
            }
            
            scrollToBottom();
            fileInput.value = ''; // Reset
        });
    }

    // --- Image Modal for Full Size View ---
    function openImageModal(imageSrc) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            cursor: pointer;
        `;

        // Create image element
        const img = document.createElement('img');
        img.src = imageSrc;
        img.style.cssText = `
            max-width: 90vw;
            max-height: 90vh;
            object-fit: contain;
            border-radius: 8px;
        `;

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 30px;
            background: rgba(255, 255, 255, 0.8);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            font-size: 24px;
            font-weight: bold;
            cursor: pointer;
            color: #000;
        `;

        modal.appendChild(img);
        modal.appendChild(closeBtn);
        document.body.appendChild(modal);

        // Close handlers
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Escape key handler
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    // --- Mobile Menu Setup ---
    function setupMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const navCenter = document.querySelector('.nav-center');
        
        if (mobileMenuBtn && navCenter) {
            mobileMenuBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                navCenter.classList.toggle('mobile-active');
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', function(e) {
                if (!navCenter.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    navCenter.classList.remove('mobile-active');
                }
            });
            
            // Close menu when clicking nav items
            const navItems = navCenter.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', function() {
                    navCenter.classList.remove('mobile-active');
                });
            });
            
            // Close menu on window resize
            window.addEventListener('resize', function() {
                if (window.innerWidth > 768) {
                    navCenter.classList.remove('mobile-active');
                }
            });
        }
    }
});
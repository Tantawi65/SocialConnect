/* ==========================================================================
   Dynamic Home Page Module
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // Only run on home page
    if (!window.location.pathname.includes('index.html') && 
        !window.location.pathname.endsWith('/') && 
        window.location.pathname !== '/') {
        return;
    }

    // --- State & Config ---
    let currentUser = null;
    const postModal = document.getElementById('post-modal');
    const fileInput = document.getElementById('file-input');
    
    // --- Initialization ---
    initDynamicFeatures();

    function initDynamicFeatures() {
        // Load User
        const storedUser = localStorage.getItem('user');
        currentUser = storedUser ? JSON.parse(storedUser) : { 
            name: 'Demo User', 
            avatar: 'images/default-avatar.jpg' 
        };

        updateUserInterface();
        setupPostModal();
        setupGlobalInteractions(); // Handles Likes, Comments, Shares, Menus
        setupProfileLink(); // Handle profile navigation
    }

    // --- UI Updates ---
    function updateUserInterface() {
        if (!postModal) return;

        // Update modal user details
        const modalUserName = postModal.querySelector('.user-details h4');
        const modalAvatar = postModal.querySelector('.modal-avatar');
        const openBtn = document.getElementById('open-post-modal');
        const textarea = document.getElementById('modal-post-content');

        if (modalUserName) modalUserName.textContent = currentUser.name;
        if (modalAvatar) modalAvatar.src = currentUser.avatar;
        
        const firstName = currentUser.name.split(' ')[0];
        if (openBtn) openBtn.textContent = `What's on your mind, ${firstName}?`;
        if (textarea) textarea.placeholder = `What's on your mind, ${firstName}?`;
    }

    // --- Post Modal Logic ---
    function setupPostModal() {
        if (!postModal) return;

        const openBtn = document.getElementById('open-post-modal');
        const closeBtn = document.getElementById('close-post-modal');
        const submitBtn = document.getElementById('submit-post');
        const textarea = document.getElementById('modal-post-content');
        const backdrop = postModal.querySelector('.modal-backdrop');

        // Open
        if (openBtn) {
            openBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openModal();
            });
        }

        // Additional Open Triggers (Photo/Activity buttons on main card)
        const photoBtn = document.getElementById('photo-video-btn');
        const feelingBtn = document.getElementById('feeling-activity-btn');
        if (photoBtn) photoBtn.addEventListener('click', () => { openModal(); setTimeout(triggerFileUpload, 300); });
        if (feelingBtn) feelingBtn.addEventListener('click', () => { openModal(); setTimeout(showFeelingSelector, 300); });

        // Close
        const closeModal = () => {
            postModal.classList.remove('show');
            setTimeout(() => {
                postModal.style.display = 'none';
                postModal.classList.add('hidden');
                clearModalContent();
            }, 300);
            document.body.style.overflow = '';
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (backdrop) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) closeModal();
            });
        }

        // Textarea Auto-Enable Submit
        if (textarea && submitBtn) {
            textarea.addEventListener('input', () => {
                submitBtn.disabled = textarea.value.trim().length === 0;
            });
        }

        // Submit
        if (submitBtn) {
            submitBtn.addEventListener('click', submitPost);
        }

        // Modal Toolbar Actions
        setupModalToolbar();
    }

    function openModal() {
        postModal.classList.remove('hidden');
        postModal.style.display = 'flex';
        // Small delay to allow display:flex to apply before adding class for opacity transition
        setTimeout(() => postModal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
        
        const textarea = document.getElementById('modal-post-content');
        if (textarea) setTimeout(() => textarea.focus(), 300);
    }

    function setupModalToolbar() {
        const addPhotoBtn = document.getElementById('add-photo-btn');
        const addFeelingBtn = document.getElementById('add-feeling-btn');
        const addLocationBtn = document.getElementById('add-location-btn');

        if (addPhotoBtn) addPhotoBtn.addEventListener('click', triggerFileUpload);
        if (addFeelingBtn) addFeelingBtn.addEventListener('click', showFeelingSelector);
        if (addLocationBtn) addLocationBtn.addEventListener('click', showLocationSelector);

        // File Input Change
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) handleFileSelection(file);
            });
        }
    }

    function triggerFileUpload() {
        if (fileInput) fileInput.click();
    }

    function handleFileSelection(file) {
        if (file.size > 10 * 1024 * 1024) {
            alert('File too large (Max 10MB)');
            return;
        }

        const url = URL.createObjectURL(file);
        const mediaPreview = document.getElementById('media-preview');
        const isVideo = file.type.startsWith('video/');
        
        mediaPreview.innerHTML = `
            <div class="media-preview-item">
                <${isVideo ? 'video controls' : 'img'} src="${url}" class="preview-media"></${isVideo ? 'video' : 'img'}>
                <button class="remove-media" type="button">&times;</button>
            </div>
        `;
        mediaPreview.style.display = 'block';

        // Enable submit button
        document.getElementById('submit-post').disabled = false;

        // Remove Handler
        mediaPreview.querySelector('.remove-media').addEventListener('click', () => {
            mediaPreview.innerHTML = '';
            mediaPreview.style.display = 'none';
            fileInput.value = '';
        });
    }

    function clearModalContent() {
        const textarea = document.getElementById('modal-post-content');
        const preview = document.getElementById('media-preview');
        if (textarea) textarea.value = '';
        if (preview) {
            preview.innerHTML = '';
            preview.style.display = 'none';
        }
        if (fileInput) fileInput.value = '';
        document.getElementById('submit-post').disabled = true;
    }

    // --- Post Submission ---
    function submitPost() {
        const textarea = document.getElementById('modal-post-content');
        const content = textarea.value.trim();
        const mediaPreview = document.getElementById('media-preview');
        const mediaEl = mediaPreview.querySelector('img, video');
        
        if (content.length === 0 && !mediaEl) return;

        const post = {
            id: 'post-' + Date.now(),
            author: currentUser.name,
            avatar: currentUser.avatar,
            content: content,
            timestamp: new Date(),
            likes: 0,
            comments: 0,
            shares: 0,
            mediaSrc: mediaEl ? mediaEl.src : null,
            mediaType: mediaEl ? mediaEl.tagName.toLowerCase() : null
        };

        addPostToFeed(post);
        
        // Close modal manually via click simulation or function
        const closeBtn = document.getElementById('close-post-modal');
        if (closeBtn) closeBtn.click();

        showNotification('Post published!', 'success');
    }

    function addPostToFeed(post) {
        const container = document.querySelector('.posts-container');
        if (!container) return;

        const postHTML = createPostHTML(post);
        const div = document.createElement('div');
        div.innerHTML = postHTML;
        const newPost = div.firstElementChild;

        container.insertBefore(newPost, container.firstChild);
        
        // Animation
        newPost.classList.add('new-post');
        setTimeout(() => newPost.classList.remove('new-post'), 500);
    }

    function createPostHTML(post) {
        // Simple Time Ago
        const timeAgo = 'Just now'; 
        
        let mediaHTML = '';
        if (post.mediaSrc) {
            mediaHTML = `<div class="post-media">
                <${post.mediaType} src="${post.mediaSrc}" ${post.mediaType === 'video' ? 'controls' : ''}></${post.mediaType}>
            </div>`;
        }

        // Linkify (Simple regex for URLs)
        const contentFormatted = post.content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');

        return `
        <article class="post-card" data-post-id="${post.id}">
            <header class="post-header">
                <img src="${post.avatar}" alt="${post.author}" class="post-avatar" />
                <div class="post-info">
                    <h4 class="post-author">${post.author}</h4>
                    <time class="post-time">${timeAgo}</time>
                </div>
                <button class="post-menu" aria-label="Options">⋯</button>
            </header>
            <div class="post-content"><p>${contentFormatted}</p></div>
            ${mediaHTML}
            <div class="post-actions">
                <button class="action-btn like-btn" data-action="like">
                    <span class="action-icon">👍</span> <span class="action-text">Like</span> <span class="action-count"></span>
                </button>
                <button class="action-btn comment-btn" data-action="comment">
                    <span class="action-icon">💬</span> <span class="action-text">Comment</span> <span class="action-count"></span>
                </button>
                <button class="action-btn share-btn" data-action="share">
                    <span class="action-icon">📤</span> <span class="action-text">Share</span> <span class="action-count"></span>
                </button>
            </div>
            <div class="post-comments" style="display: none;"></div>
        </article>`;
    }

    // --- Global Interactions (Delegation) ---
    function setupGlobalInteractions() {
        document.body.addEventListener('click', function(e) {
            
            // 1. Post Menu (Three dots)
            const menuBtn = e.target.closest('.post-menu');
            if (menuBtn) {
                e.preventDefault();
                e.stopPropagation(); // Stop bubbling so we don't immediately close it
                showPostDropdown(menuBtn);
                return;
            }

            // 2. Action Buttons (Like, Comment, Share)
            const actionBtn = e.target.closest('.action-btn');
            if (actionBtn) {
                e.preventDefault();
                const action = actionBtn.dataset.action;
                const postCard = actionBtn.closest('.post-card');
                
                if (action === 'like') handleLike(actionBtn);
                if (action === 'comment') handleComment(actionBtn, postCard);
                if (action === 'share') handleShare(actionBtn, postCard);
                return;
            }
            
            // 3. Close Dropdowns if clicking elsewhere
            closeAllDropdowns();
        });
    }

    function handleLike(btn) {
        btn.classList.toggle('liked');
        const icon = btn.querySelector('.action-icon');
        const countSpan = btn.querySelector('.action-count');
        let count = parseInt(countSpan.textContent?.match(/\d+/)?.[0] || '0') || 0;

        if (btn.classList.contains('liked')) {
            icon.textContent = '❤️'; // Change icon
            btn.style.color = '#e74c3c'; // Red
            count++;
        } else {
            icon.textContent = '👍'; // Revert
            btn.style.color = '';
            count = Math.max(0, count - 1);
        }
        countSpan.textContent = count > 0 ? count : '';
    }

    function handleComment(btn, postCard) {
        let commentsSection = postCard.querySelector('.post-comments');
        
        // If no comments section exists, create one
        if (!commentsSection) {
            commentsSection = document.createElement('div');
            commentsSection.className = 'post-comments';
            commentsSection.style.display = 'none';
            postCard.appendChild(commentsSection);
        }
        
        const isHidden = commentsSection.style.display === 'none';
        
        if (isHidden) {
            commentsSection.style.display = 'block';
            if (commentsSection.innerHTML.trim() === '') {
                // Load dummy comments and form on first click
                loadCommentsInterface(commentsSection);
            }
        } else {
            commentsSection.style.display = 'none';
        }
    }

    function loadCommentsInterface(container) {
        // Add better styling to the comments section
        container.style.cssText = `
            padding: 15px;
            background: #f8f9fa;
            border-top: 1px solid #e4e6ea;
            margin-top: 10px;
        `;
        
        // Simple Dummy Comment with better styling
        const dummyHTML = `
            <div class="comments-container" style="margin-bottom: 15px;">
                <div class="comment-item" style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                    <img src="images/default-avatar.jpg" class="comment-avatar" 
                         style="width: 32px; height: 32px; border-radius: 50%; margin-right: 10px; flex-shrink: 0;">
                    <div class="comment-content" style="flex: 1;">
                        <div class="comment-bubble" style="
                            background: #ffffff; 
                            border-radius: 16px; 
                            padding: 8px 12px; 
                            display: inline-block;
                            border: 1px solid #e4e6ea;
                            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                        ">
                            <div class="comment-author" style="font-weight: 600; font-size: 13px; color: #050505; margin-bottom: 2px;">Someone</div>
                            <div class="comment-text" style="font-size: 14px; color: #050505; line-height: 1.3;">Great post!</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="comment-form" style="
                display: flex; 
                align-items: center; 
                background: #ffffff;
                border-radius: 20px;
                padding: 8px;
                border: 1px solid #e4e6ea;
            ">
                <img src="${currentUser.avatar}" class="comment-avatar" 
                     style="width: 32px; height: 32px; border-radius: 50%; margin-right: 10px; flex-shrink: 0;">
                <div class="comment-input-container" style="flex: 1;">
                    <input type="text" class="comment-input" placeholder="Write a comment..." 
                           style="
                               width: 100%; 
                               border: none; 
                               outline: none; 
                               background: transparent;
                               font-size: 14px;
                               padding: 6px 0;
                               color: #050505;
                           ">
                </div>
                <button class="comment-publish-btn" type="button" style="
                    background: #1877f2;
                    color: white;
                    border: none;
                    border-radius: 16px;
                    padding: 6px 12px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-left: 8px;
                    transition: background-color 0.2s;
                " onmouseover="this.style.backgroundColor='#166fe5'" onmouseout="this.style.backgroundColor='#1877f2'">Post</button>
            </div>`;
        container.innerHTML = dummyHTML;

        // Function to post comment
        const postComment = () => {
            const input = container.querySelector('.comment-input');
            if (input.value.trim()) {
                const text = input.value;
                const list = container.querySelector('.comments-container');
                
                const newComment = document.createElement('div');
                newComment.className = 'comment-item';
                newComment.style.cssText = 'display: flex; align-items: flex-start; margin-bottom: 12px;';
                newComment.innerHTML = `
                    <img src="${currentUser.avatar}" class="comment-avatar" 
                         style="width: 32px; height: 32px; border-radius: 50%; margin-right: 10px; flex-shrink: 0;">
                    <div class="comment-content" style="flex: 1;">
                        <div class="comment-bubble" style="
                            background: #ffffff; 
                            border-radius: 16px; 
                            padding: 8px 12px; 
                            display: inline-block;
                            border: 1px solid #e4e6ea;
                            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                        ">
                            <div class="comment-author" style="font-weight: 600; font-size: 13px; color: #050505; margin-bottom: 2px;">${currentUser.name}</div>
                            <div class="comment-text" style="font-size: 14px; color: #050505; line-height: 1.3;">${text}</div>
                        </div>
                    </div>`;
                list.appendChild(newComment);
                input.value = '';
                
                // Update Count
                const countSpan = container.closest('.post-card').querySelector('.comment-btn .action-count');
                let c = parseInt(countSpan.textContent) || 0;
                countSpan.textContent = c + 1;
            }
        };

        // Attach Enter Key listener for the input
        const input = container.querySelector('.comment-input');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                postComment();
            }
        });

        // Attach click listener for the Post button
        const postBtn = container.querySelector('.comment-publish-btn');
        postBtn.addEventListener('click', postComment);
    }

    function handleShare(btn, postCard) {
        let countSpan = btn.querySelector('.action-count');
        let count = parseInt(countSpan.textContent) || 0;
        countSpan.textContent = count + 1;
        showNotification('Link copied to clipboard!', 'success');
    }

    // --- Dropdowns & Modals (Simplified) ---
    function showPostDropdown(btn) {
        closeAllDropdowns(); // Close others first
        
        const menu = document.createElement('div');
        menu.className = 'post-menu-dropdown';
        menu.style.position = 'absolute';
        menu.style.right = '1rem';
        menu.style.marginTop = '0.5rem';
        menu.style.backgroundColor = 'white';
        menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        menu.style.borderRadius = '8px';
        menu.style.padding = '0.5rem';
        menu.style.zIndex = '100';
        
        menu.innerHTML = `
            <button class="post-menu-item" style="display:block; width:100%; text-align:left; padding:0.5rem; background:none; border:none; cursor:pointer;">💾 Save Post</button>
            <button class="post-menu-item" style="display:block; width:100%; text-align:left; padding:0.5rem; background:none; border:none; cursor:pointer;">⚠️ Report</button>
        `;

        // Append to the header (which should have relative positioning usually, or append to body and calculate pos)
        btn.parentElement.style.position = 'relative'; 
        btn.parentElement.appendChild(menu);
        
        menu.querySelectorAll('button').forEach(b => {
            b.addEventListener('click', () => {
                showNotification('Action performed', 'info');
                menu.remove();
            });
        });
    }

    function closeAllDropdowns() {
        document.querySelectorAll('.post-menu-dropdown').forEach(el => el.remove());
    }

    // --- Helpers: Feelings & Location Selectors ---
    // Instead of complex dynamic modals, we create a simple overlay on demand
    function createSelectorOverlay(title, options, callback) {
        const div = document.createElement('div');
        div.className = 'modal show'; // Reuse modal CSS
        div.style.display = 'flex';
        div.style.zIndex = '1100'; // Higher than post modal
        
        const buttons = options.map(opt => 
            `<button class="selection-item" style="padding:10px; margin:5px; border:1px solid #ddd; border-radius:5px; background:white; cursor:pointer;">
                ${opt.icon} ${opt.text}
             </button>`
        ).join('');

        div.innerHTML = `
            <div class="modal-content" style="max-width:400px; text-align:center;">
                <h3>${title}</h3>
                <div style="display:flex; flex-wrap:wrap; justify-content:center; padding:10px;">${buttons}</div>
                <button class="close-selector" style="margin-top:10px; padding:5px 15px;">Cancel</button>
            </div>
        `;

        document.body.appendChild(div);

        // Click Handler
        div.querySelectorAll('.selection-item').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                callback(options[index]);
                div.remove();
            });
        });

        div.querySelector('.close-selector').addEventListener('click', () => div.remove());
    }

    function showFeelingSelector() {
        const options = [
            { icon: '😊', text: 'happy' }, { icon: '😍', text: 'loved' },
            { icon: '😢', text: 'sad' }, { icon: '😎', text: 'cool' }
        ];
        createSelectorOverlay('How are you feeling?', options, (selected) => {
            const txt = document.getElementById('modal-post-content');
            txt.value += ` — feeling ${selected.text} ${selected.icon}`;
        });
    }

    function showLocationSelector() {
        const options = [
            { icon: '🏠', text: 'Home' }, { icon: '🏢', text: 'Work' },
            { icon: '🏖️', text: 'Beach' }
        ];
        createSelectorOverlay('Where are you?', options, (selected) => {
            const txt = document.getElementById('modal-post-content');
            txt.value += ` — at ${selected.text} ${selected.icon}`;
        });
    }

    function showNotification(msg, type) {
        const div = document.createElement('div');
        div.className = `notification notification-${type}`;
        div.innerHTML = `${msg} <button>&times;</button>`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
        div.querySelector('button').addEventListener('click', () => div.remove());
    }

    // --- Profile Navigation ---
    function setupProfileLink() {
        const profileLink = document.getElementById('profile-link');
        if (profileLink) {
            profileLink.style.cursor = 'pointer';
            profileLink.addEventListener('click', () => {
                window.location.href = 'profile.html';
            });
        }
    }
});
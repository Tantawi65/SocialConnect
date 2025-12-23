/* ==========================================================================
   Dynamic Home Page Module - Django Adapted
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // Check if we're on the home page (has post cards)
    const hasPostCards = document.querySelector('.post-card');
    const hasPostCreator = document.querySelector('.post-creator');
    
    // Only run full features on home page, but post menu should work if post cards exist
    const isHomePage = window.location.pathname === '/' || 
                       window.location.pathname === '' ||
                       window.location.pathname.endsWith('/') && window.location.pathname.length <= 2;

    // --- State & Config ---
    let currentUser = window.currentUserData || { name: 'User', avatar: '/media/defaults/default.jpg' };
    const postModal = document.getElementById('post-modal');
    const fileInput = document.getElementById('file-input');
    
    // Get CSRF token
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');
    
    // --- Initialization ---
    initDynamicFeatures();

    function initDynamicFeatures() {
        updateUserInterface();
        setupPostModal();
    }

    // --- UI Updates ---
    function updateUserInterface() {
        if (!postModal) return;

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

        // Additional Open Triggers
        const photoBtn = document.getElementById('photo-video-btn');
        const feelingBtn = document.getElementById('feeling-activity-btn');
        if (photoBtn) photoBtn.addEventListener('click', () => { openModal(); setTimeout(triggerFileUpload, 300); });
        if (feelingBtn) feelingBtn.addEventListener('click', () => { openModal(); });

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

        document.getElementById('submit-post').disabled = false;

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
        
        if (content.length === 0) return;

        // Use form submission to Django
        const form = document.getElementById('post-form');
        if (form) {
            form.submit();
        } else {
            // Fallback: create form dynamically
            const formData = new FormData();
            formData.append('content', content);
            formData.append('csrfmiddlewaretoken', csrftoken);
            
            // If there's a file
            if (fileInput && fileInput.files.length > 0) {
                formData.append('image', fileInput.files[0]);
            }

            fetch('/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrftoken
                }
            })
            .then(response => {
                if (response.ok) {
                    window.location.reload();
                } else {
                    alert('Failed to create post');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to create post');
            });
        }
    }
    
    // --- Helpers: Feelings & Location Selectors ---
    function showFeelingSelector() {
        const options = [
            { icon: '😊', text: 'happy' }, 
            { icon: '😍', text: 'loved' },
            { icon: '😢', text: 'sad' }, 
            { icon: '😎', text: 'cool' },
            { icon: '😂', text: 'laughing' },
            { icon: '😴', text: 'sleepy' }
        ];
        createSelectorOverlay('How are you feeling?', options, (selected) => {
            const txt = document.getElementById('modal-post-content');
            txt.value += ` — feeling ${selected.text} ${selected.icon}`;
            document.getElementById('submit-post').disabled = false;
        });
    }

    function showLocationSelector() {
        const options = [
            { icon: '🏠', text: 'Home' }, 
            { icon: '🏢', text: 'Work' },
            { icon: '🏖️', text: 'Beach' },
            { icon: '🏔️', text: 'Mountains' },
            { icon: '🍕', text: 'Restaurant' },
            { icon: '✈️', text: 'Traveling' }
        ];
        createSelectorOverlay('Where are you?', options, (selected) => {
            const txt = document.getElementById('modal-post-content');
            txt.value += ` — at ${selected.text} ${selected.icon}`;
            document.getElementById('submit-post').disabled = false;
        });
    }
    
    function createSelectorOverlay(title, options, callback) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const buttons = options.map(opt => 
            `<button class="selection-item" style="padding:12px 20px; margin:8px; border:1px solid #ddd; border-radius:8px; background:white; cursor:pointer; font-size:15px; transition: background 0.2s;" onmouseover="this.style.background='#f0f2f5'" onmouseout="this.style.background='white'">
                ${opt.icon} ${opt.text}
             </button>`
        ).join('');

        overlay.innerHTML = `
            <div class="selector-content" style="background:white; border-radius:12px; padding:24px; max-width:450px; width:90%; box-shadow:0 4px 20px rgba(0,0,0,0.3); position:relative;">
                <h3 style="margin:0 0 20px 0; font-size:20px; font-weight:600;">${title}</h3>
                <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin-bottom:20px;">${buttons}</div>
                <button class="close-selector" style="width:100%; padding:10px 20px; background:#e4e6eb; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-size:15px; transition: background 0.2s;" onmouseover="this.style.background='#d8dadf'" onmouseout="this.style.background='#e4e6eb'">Cancel</button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Click Handler
        overlay.querySelectorAll('.selection-item').forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                callback(options[index]);
                overlay.remove();
            });
        });

        overlay.querySelector('.close-selector').addEventListener('click', (e) => {
            e.stopPropagation();
            overlay.remove();
        });
        
        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }

    // --- Post Menu Dropdown ---
    setupPostMenus();

    function setupPostMenus() {
        console.log('Setting up post menus...');
        // Toggle dropdown on menu button click
        document.addEventListener('click', function(e) {
            const menuBtn = e.target.closest('.post-menu-btn');
            console.log('Click detected', menuBtn);
            
            if (menuBtn) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Menu button clicked, postId:', menuBtn.dataset.postId);
                togglePostMenu(menuBtn);
            } else if (!e.target.closest('.post-menu-dropdown')) {
                // Close all dropdowns when clicking outside
                document.querySelectorAll('.post-menu-dropdown').forEach(menu => menu.remove());
            }
        });

        // Handle delete post action
        document.addEventListener('click', function(e) {
            const deleteBtn = e.target.closest('.delete-post-btn');
            
            if (deleteBtn) {
                e.preventDefault();
                e.stopPropagation();
                
                const postId = deleteBtn.getAttribute('data-post-id');
                if (postId) {
                    confirmDeletePost(postId);
                }
            }
        });
    }

    function togglePostMenu(btn) {
        // Close any existing menus
        document.querySelectorAll('.post-menu-dropdown').forEach(menu => menu.remove());
        
        const postId = btn.dataset.postId;
        const dropdown = document.createElement('div');
        dropdown.className = 'post-menu-dropdown';
        dropdown.innerHTML = `
            <button class="delete-post-btn" data-post-id="${postId}" type="button">
                <span style="margin-right: 8px;">🗑️</span>
                Delete Post
            </button>`;
        
        // Position dropdown
        const rect = btn.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + 5}px`;
        dropdown.style.right = `${window.innerWidth - rect.right}px`;
        
        document.body.appendChild(dropdown);
        
        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!dropdown.contains(e.target) && e.target !== btn) {
                    dropdown.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 0);
    }

    function confirmDeletePost(postId) {
        // Remove any existing modals
        const existingModal = document.getElementById('delete-post-modal');
        if (existingModal) existingModal.remove();
        
        // Close any existing dropdowns
        document.querySelectorAll('.post-menu-dropdown').forEach(menu => menu.remove());
        
        const modal = document.createElement('div');
        modal.id = 'delete-post-modal';
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="custom-modal-content">
                <h3 style="margin: 0 0 10px 0; font-size: 18px;">Delete Post</h3>
                <p style="margin: 0 0 20px 0; color: #65676b;">Are you sure you want to delete this post? This action cannot be undone.</p>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="modal-btn modal-btn-cancel" type="button">Cancel</button>
                    <button class="modal-btn modal-btn-delete" type="button">Delete</button>
                </div>
            </div>`;
        
        document.body.appendChild(modal);
        
        // Cancel button
        modal.querySelector('.modal-btn-cancel').addEventListener('click', () => modal.remove());
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // Delete button
        modal.querySelector('.modal-btn-delete').addEventListener('click', () => {
            deletePost(postId);
            modal.remove();
        });
    }

    function deletePost(postId) {
        fetch(`/post/${postId}/delete/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Remove the post card from DOM
                const postCard = document.querySelector(`.post-card[data-post-id="${postId}"]`);
                if (postCard) {
                    postCard.style.transition = 'opacity 0.3s, transform 0.3s';
                    postCard.style.opacity = '0';
                    postCard.style.transform = 'translateY(-10px)';
                    setTimeout(() => postCard.remove(), 300);
                }
            } else {
                alert(data.error || 'Failed to delete post');
            }
        })
        .catch(error => {
            console.error('Error deleting post:', error);
            alert('An error occurred while deleting the post');
        });
    }

    // --- Share Post Functionality ---
    setupShareFeature();

    function setupShareFeature() {
        const shareModal = document.getElementById('share-modal');
        const closeShareBtn = document.getElementById('close-share-modal');
        const cancelShareBtn = document.getElementById('cancel-share');
        const submitShareBtn = document.getElementById('submit-share');
        const shareCaption = document.getElementById('share-caption');
        const sharePreview = document.getElementById('share-post-preview');
        const shareBackdrop = document.querySelector('.share-modal-backdrop');
        
        let currentSharePostId = null;
        
        // Handle share button click
        document.addEventListener('click', function(e) {
            const shareBtn = e.target.closest('.share-btn');
            if (shareBtn) {
                e.preventDefault();
                const postId = shareBtn.dataset.postId;
                const postAuthor = shareBtn.dataset.postAuthor;
                const postCard = shareBtn.closest('.post-card');
                const postContent = postCard.querySelector('.post-content p')?.textContent || '';
                
                currentSharePostId = postId;
                
                // Set preview
                sharePreview.innerHTML = `
                    <div class="share-preview-header">
                        <span class="share-preview-author">@${postAuthor}</span>
                    </div>
                    <div class="share-preview-content">${postContent.substring(0, 200)}${postContent.length > 200 ? '...' : ''}</div>
                `;
                
                // Clear caption
                shareCaption.value = '';
                
                // Show modal
                shareModal.style.display = 'flex';
            }
        });
        
        // Close modal functions
        function closeShareModal() {
            shareModal.style.display = 'none';
            currentSharePostId = null;
        }
        
        if (closeShareBtn) closeShareBtn.addEventListener('click', closeShareModal);
        if (cancelShareBtn) cancelShareBtn.addEventListener('click', closeShareModal);
        if (shareBackdrop) shareBackdrop.addEventListener('click', closeShareModal);
        
        // Submit share
        if (submitShareBtn) {
            submitShareBtn.addEventListener('click', function() {
                if (!currentSharePostId) return;
                
                submitShareBtn.disabled = true;
                submitShareBtn.textContent = 'Sharing...';
                
                const formData = new FormData();
                formData.append('caption', shareCaption.value);
                
                fetch(`/post/${currentSharePostId}/share/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrftoken
                    },
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Update share count on the post
                        const postCard = document.querySelector(`.post-card[data-post-id="${currentSharePostId}"]`);
                        if (postCard) {
                            const shareCountEl = postCard.querySelector('.share-btn .action-count');
                            if (shareCountEl) {
                                shareCountEl.textContent = data.share_count || '';
                            }
                        }
                        
                        closeShareModal();
                        showNotification('Post shared to your profile!', 'success');
                    } else {
                        showNotification(data.error || 'Failed to share post', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error sharing post:', error);
                    showNotification('An error occurred while sharing', 'error');
                })
                .finally(() => {
                    submitShareBtn.disabled = false;
                    submitShareBtn.textContent = 'Share Now';
                });
            });
        }
    }
    
    function showNotification(message, type) {
        // Remove existing notification
        const existing = document.querySelector('.share-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `share-notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            background: ${type === 'success' ? '#42b883' : '#e74c3c'};
            color: white;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }
});

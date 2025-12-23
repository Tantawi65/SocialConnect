/* ==========================================================================
   Profile Module - Django Integrated
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    console.log('Profile JS Loaded');

    // Use data from Django template
    const currentUser = typeof currentUserData !== 'undefined' ? currentUserData : null;
    const profileUser = typeof profileUserData !== 'undefined' ? profileUserData : null;
    
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

    // --- INITIALIZATION ---
    function init() {
        setupGlobalClicks();
        setupFormSaving();
        setupPhotoUploads();
        setupMobileMenu();
    }

    // --- GLOBAL CLICK HANDLER ---
    function setupGlobalClicks() {
        document.body.addEventListener('click', function(e) {
            const target = e.target;

            // --- LIKE BUTTON ---
            const likeBtn = target.closest('.like-btn');
            if (likeBtn) {
                e.preventDefault();
                const postId = likeBtn.dataset.postId;
                
                fetch(`/post/${postId}/like/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    const post = likeBtn.closest('.post-card');
                    const likesCountSpan = post?.querySelector('.likes-count');
                    const icon = likeBtn.querySelector('.action-icon');
                    
                    if (data.liked) {
                        likeBtn.classList.add('liked');
                        likeBtn.style.color = '#e74c3c';
                        if (icon) icon.textContent = '❤️';
                    } else {
                        likeBtn.classList.remove('liked');
                        likeBtn.style.color = '';
                        if (icon) icon.textContent = '👍';
                    }
                    
                    if (likesCountSpan) {
                        likesCountSpan.textContent = `${data.like_count} like${data.like_count === 1 ? '' : 's'}`;
                    }
                })
                .catch(error => console.error('Error:', error));
                return;
            }

            // --- COMMENT BUTTON ---
            const commentBtn = target.closest('.comment-btn');
            if (commentBtn) {
                e.preventDefault();
                const post = commentBtn.closest('.post-card');
                let section = post?.querySelector('.post-comments');
                
                if (!section) {
                    section = document.createElement('div');
                    section.className = 'post-comments';
                    section.style.display = 'none';
                    post.appendChild(section);
                }
                
                const isHidden = window.getComputedStyle(section).display === 'none';
                section.style.display = isHidden ? 'block' : 'none';
                
                if (isHidden && section.innerHTML.trim() === '') {
                    loadCommentsInterface(section);
                }
                return;
            }

            // --- SHARE BUTTON ---
            const shareBtn = target.closest('.share-btn');
            if (shareBtn) {
                e.preventDefault();
                alert('Post shared!');
                return;
            }

            // --- POST MENU BUTTON (THREE DOTS) ---
            const postMenuBtn = target.closest('.post-menu-btn');
            if (postMenuBtn) {
                e.preventDefault();
                togglePostMenu(postMenuBtn);
                return;
            }

            // --- DELETE POST FROM DROPDOWN ---
            const deletePostBtn = target.closest('.delete-post-btn');
            if (deletePostBtn) {
                e.preventDefault();
                const postId = deletePostBtn.dataset.postId;
                confirmDeletePost(postId);
                return;
            }

            // --- OPEN EDIT MODAL ---
            if (target.closest('.edit-profile-btn') || target.closest('.edit-details-btn')) {
                e.preventDefault();
                openEditModal();
                return;
            }

            // --- CLOSE MODALS ---
            if (target.classList.contains('modal-overlay') || target.closest('.modal-close-btn') || target.classList.contains('btn-cancel')) {
                e.preventDefault();
                document.querySelectorAll('.modal').forEach(m => {
                    m.classList.add('hidden');
                    m.style.display = 'none';
                });
            }
        });
    }

    // --- SAVING PROFILE ---
    function setupFormSaving() {
        const saveBtn = document.querySelector('.btn-save');
        const form = document.getElementById('edit-profile-form');

        const handleSave = (e) => {
            e.preventDefault();
            
            if (form) {
                form.submit();
            }
        };

        if (saveBtn) saveBtn.addEventListener('click', handleSave);
    }

    function openEditModal() {
        const modal = document.getElementById('edit-profile-modal');
        if (!modal) return;

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }

    // --- PHOTO UPLOADS ---
    function setupPhotoUploads() {
        const coverBtn = document.getElementById('edit-cover-btn');
        const profileBtn = document.getElementById('edit-picture-btn');
        const coverInput = document.getElementById('cover-photo-input');
        const profileInput = document.getElementById('profile-photo-input');

        if (coverBtn && coverInput) {
            coverBtn.addEventListener('click', (e) => {
                e.preventDefault();
                coverInput.click();
            });
            
            coverInput.addEventListener('change', () => {
                if (coverInput.files[0]) {
                    uploadPhoto(coverInput.files[0], 'cover');
                }
            });
        }

        if (profileBtn && profileInput) {
            profileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                profileInput.click();
            });
            
            profileInput.addEventListener('change', () => {
                if (profileInput.files[0]) {
                    uploadPhoto(profileInput.files[0], 'profile');
                }
            });
        }
    }

    function uploadPhoto(file, type) {
        const formData = new FormData();
        formData.append(type === 'cover' ? 'cover_photo' : 'profile_photo', file);
        
        fetch(window.location.href, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken
            },
            body: formData
        })
        .then(response => {
            if (response.ok) {
                location.reload();
            }
        })
        .catch(error => console.error('Error:', error));
    }

    // --- LOAD COMMENTS INTERFACE ---
    function loadCommentsInterface(container) {
        const post = container.closest('.post-card');
        const commentBtn = post.querySelector('.comment-btn');
        const postId = commentBtn.dataset.postId;
        
        container.style.cssText = `
            padding: 15px;
            background: #f8f9fa;
            border-top: 1px solid #e4e6ea;
            margin-top: 10px;
        `;
        
        // Fetch comments from server
        fetch(`/post/${postId}/comments/`)
            .then(response => response.json())
            .then(data => {
                let commentsHTML = '<div class="comments-container" style="margin-bottom: 15px;">';
                
                data.comments.forEach(comment => {
                    commentsHTML += `
                        <div class="comment-item" style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                            <img src="${comment.avatar}" class="comment-avatar" 
                                 style="width: 32px; height: 32px; border-radius: 50%; margin-right: 10px;">
                            <div class="comment-content" style="flex: 1;">
                                <div class="comment-bubble" style="background: #fff; border-radius: 16px; padding: 8px 12px; display: inline-block; border: 1px solid #e4e6ea;">
                                    <div class="comment-author" style="font-weight: 600; font-size: 13px;">${comment.user}</div>
                                    <div class="comment-text" style="font-size: 14px;">${escapeHtml(comment.content)}</div>
                                </div>
                            </div>
                        </div>`;
                });
                
                commentsHTML += '</div>';
                
                // Add comment form
                commentsHTML += `
                    <div class="comment-form" style="display: flex; align-items: center; background: #fff; border-radius: 20px; padding: 8px; border: 1px solid #e4e6ea;">
                        <img src="${currentUser ? currentUser.avatar : '/media/defaults/default-avatar.jpg'}" class="comment-avatar" 
                             style="width: 32px; height: 32px; border-radius: 50%; margin-right: 10px;">
                        <input type="text" class="comment-input" placeholder="Write a comment..." 
                               style="flex: 1; border: none; outline: none; font-size: 14px; padding: 6px;">
                        <button class="comment-publish-btn" data-post-id="${postId}" type="button" style="background: #1877f2; color: white; border: none; border-radius: 16px; padding: 6px 12px; font-weight: 600; cursor: pointer; margin-left: 8px;">Post</button>
                    </div>`;
                
                container.innerHTML = commentsHTML;
                
                // Setup comment posting
                const input = container.querySelector('.comment-input');
                const postBtn = container.querySelector('.comment-publish-btn');
                
                const postComment = () => {
                    if (input.value.trim()) {
                        const formData = new FormData();
                        formData.append('content', input.value);
                        
                        fetch(`/post/${postId}/comment/`, {
                            method: 'POST',
                            headers: {
                                'X-CSRFToken': csrftoken
                            },
                            body: formData
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                const list = container.querySelector('.comments-container');
                                const newComment = document.createElement('div');
                                newComment.className = 'comment-item';
                                newComment.style.cssText = 'display: flex; align-items: flex-start; margin-bottom: 12px;';
                                newComment.innerHTML = `
                                    <img src="${data.comment.avatar}" class="comment-avatar" 
                                         style="width: 32px; height: 32px; border-radius: 50%; margin-right: 10px;">
                                    <div class="comment-content" style="flex: 1;">
                                        <div class="comment-bubble" style="background: #fff; border-radius: 16px; padding: 8px 12px; display: inline-block; border: 1px solid #e4e6ea;">
                                            <div class="comment-author" style="font-weight: 600; font-size: 13px;">${data.comment.user}</div>
                                            <div class="comment-text" style="font-size: 14px;">${escapeHtml(data.comment.content)}</div>
                                        </div>
                                    </div>`;
                                list.appendChild(newComment);
                                input.value = '';
                                
                                // Update count
                                const commentsCountSpan = post?.querySelector('.comments-count');
                                if (commentsCountSpan) {
                                    commentsCountSpan.textContent = `${data.comment_count} comment${data.comment_count === 1 ? '' : 's'}`;
                                }
                            }
                        })
                        .catch(error => console.error('Error:', error));
                    }
                };
                
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        postComment();
                    }
                });
                
                postBtn.addEventListener('click', postComment);
            })
            .catch(error => console.error('Error loading comments:', error));
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- POST MENU TOGGLE ---
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
        dropdown.style.position = 'absolute';
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

    // --- CONFIRM DELETE POST ---
    function confirmDeletePost(postId) {
        // Remove any existing modals
        const existingModal = document.getElementById('delete-post-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'delete-post-modal';
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="custom-modal-content">
                <h3 style="margin: 0 0 10px 0; font-size: 18px;">Delete Post</h3>
                <p style="margin: 0 0 20px 0; color: #65676b;">Are you sure you want to delete this post? This action cannot be undone.</p>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="modal-btn modal-btn-cancel" type="button">Cancel</button>
                    <button class="modal-btn modal-btn-delete" data-post-id="${postId}" type="button">Delete</button>
                </div>
            </div>`;
        
        document.body.appendChild(modal);
        
        // Handle button clicks
        modal.querySelector('.modal-btn-cancel').addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-btn-delete').addEventListener('click', () => {
            deletePost(postId);
            modal.remove();
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // --- DELETE POST ---
    function deletePost(postId) {
        fetch(`/post/${postId}/delete/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Remove the post card from DOM
                const postCard = document.querySelector(`[data-post-id="${postId}"]`)?.closest('.post-card');
                if (postCard) {
                    postCard.style.transition = 'opacity 0.3s';
                    postCard.style.opacity = '0';
                    setTimeout(() => postCard.remove(), 300);
                }
                
                // Remove dropdown if exists
                document.querySelectorAll('.post-menu-dropdown').forEach(menu => menu.remove());
            } else {
                alert(data.message || 'Failed to delete post');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while deleting the post');
        });
    }

    // --- Mobile Menu ---
    function setupMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const navCenter = document.querySelector('.nav-center');
        
        if (mobileMenuBtn && navCenter) {
            mobileMenuBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                navCenter.classList.toggle('mobile-active');
            });
            
            document.addEventListener('click', function(e) {
                if (!navCenter.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    navCenter.classList.remove('mobile-active');
                }
            });
        }
    }

    // --- Block/Unblock Feature ---
    function setupBlockFeature() {
        // Block button
        document.addEventListener('click', function(e) {
            const blockBtn = e.target.closest('.block-btn');
            if (blockBtn) {
                const username = blockBtn.dataset.username;
                if (confirm(`Are you sure you want to block ${username}? This will unfriend them and prevent all interactions.`)) {
                    fetch(`/block/${username}/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrftoken,
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert(data.message);
                            location.reload();
                        } else {
                            alert(data.error || 'Failed to block user');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('An error occurred');
                    });
                }
            }
        });
        
        // Unblock button
        document.addEventListener('click', function(e) {
            const unblockBtn = e.target.closest('.unblock-btn');
            if (unblockBtn) {
                const username = unblockBtn.dataset.username;
                if (confirm(`Are you sure you want to unblock ${username}?`)) {
                    fetch(`/unblock/${username}/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrftoken,
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert(data.message);
                            location.reload();
                        } else {
                            alert(data.error || 'Failed to unblock user');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('An error occurred');
                    });
                }
            }
        });
    }

    // --- Unshare Feature ---
    function setupUnshareFeature() {
        document.addEventListener('click', function(e) {
            const unshareBtn = e.target.closest('.unshare-btn');
            if (unshareBtn) {
                const postId = unshareBtn.dataset.postId;
                if (confirm('Remove this shared post from your profile?')) {
                    fetch(`/post/${postId}/unshare/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrftoken,
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            const sharedPost = unshareBtn.closest('.shared-post');
                            if (sharedPost) {
                                sharedPost.style.transition = 'opacity 0.3s';
                                sharedPost.style.opacity = '0';
                                setTimeout(() => sharedPost.remove(), 300);
                            }
                        } else {
                            alert(data.error || 'Failed to remove shared post');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('An error occurred');
                    });
                }
            }
        });
    }

    // --- Share Feature ---
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
            if (shareBtn && shareModal) {
                e.preventDefault();
                const postId = shareBtn.dataset.postId;
                const postAuthor = shareBtn.dataset.postAuthor;
                const postCard = shareBtn.closest('.post-card');
                const postContent = postCard.querySelector('.post-content p')?.textContent || '';
                
                currentSharePostId = postId;
                
                // Set preview
                if (sharePreview) {
                    sharePreview.innerHTML = `
                        <div class="share-preview-header">
                            <span class="share-preview-author">@${postAuthor}</span>
                        </div>
                        <div class="share-preview-content">${postContent.substring(0, 200)}${postContent.length > 200 ? '...' : ''}</div>
                    `;
                }
                
                // Clear caption
                if (shareCaption) shareCaption.value = '';
                
                // Show modal
                shareModal.style.display = 'flex';
            }
        });
        
        // Close modal functions
        function closeShareModal() {
            if (shareModal) {
                shareModal.style.display = 'none';
                currentSharePostId = null;
            }
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
                formData.append('caption', shareCaption ? shareCaption.value : '');
                
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

    // Run Init
    init();
    setupBlockFeature();
    setupUnshareFeature();
    setupShareFeature();
});

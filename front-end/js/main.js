/* ==========================================================================
   Main Module - Pure Vanilla JS Version
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    // Only run if we are on the home page/feed
    if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
        // As a fallback, check if the feed container exists
        if (!document.querySelector('.posts-container')) return;
    }

    let postCounter = 0;
    let currentUser = null;
    
    initMainPage();
    
    function initMainPage() {
        // Load user from storage or use default
        const storedUser = localStorage.getItem('user');
        currentUser = storedUser ? JSON.parse(storedUser) : { 
            name: 'Demo User', 
            avatar: 'images/default-avatar.jpg' 
        };

        updateUserInterface();
        setupPostCreation();
        setupNavigation();
        setupSearch();
        loadInitialPosts();
    }

    // --- Helper Function: Time Ago ---
    function formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m";
        return "Just now";
    }
    
    function updateUserInterface() {
        // Update user avatar and name across the page
        const userAvatars = document.querySelectorAll('.user-avatar');
        const userNames = document.querySelectorAll('.user-name');
        
        userAvatars.forEach(function(avatar) {
            avatar.src = currentUser.avatar;
            avatar.alt = currentUser.name;
        });
        
        userNames.forEach(function(nameElement) {
            nameElement.textContent = currentUser.name;
        });
        
        // Update profile link section and user card specifically
        const profileImages = document.querySelectorAll('.profile-link-avatar, .profile-section img, .profile-img, .creator-avatar');
        const profileNames = document.querySelectorAll('.profile-link-name, .profile-section h4, .user-card h3');
        
        profileImages.forEach(function(img) {
            img.src = currentUser.avatar;
            img.alt = currentUser.name;
        });
        
        profileNames.forEach(function(nameElement) {
            const text = nameElement.textContent;
            if (text !== 'Shortcuts' && text !== 'See your profile') {
                nameElement.textContent = currentUser.name;
            }
        });
    }
    
    function setupPostCreation() {
        const postTextarea = document.getElementById('post-textarea');
        const postButton = document.getElementById('post-button');
        const imageUpload = document.getElementById('image-upload');
        const uploadTrigger = document.getElementById('upload-trigger');
        
        if (postTextarea && postButton) {
            // Enable/disable post button based on content
            postTextarea.addEventListener('input', function() {
                const hasContent = postTextarea.value.trim().length > 0;
                postButton.disabled = !hasContent;
                
                if (hasContent) {
                    postButton.classList.add('active');
                } else {
                    postButton.classList.remove('active');
                }
            });
            
            // Handle post submission click
            postButton.addEventListener('click', function(event) {
                event.preventDefault();
                handlePostSubmission();
            });
            
            // Handle Ctrl+Enter to submit
            postTextarea.addEventListener('keydown', function(event) {
                if (event.ctrlKey && event.key === 'Enter') {
                    event.preventDefault();
                    if (!postButton.disabled) {
                        handlePostSubmission();
                    }
                }
            });
        }
        
        // Image upload handling
        if (imageUpload && uploadTrigger) {
            uploadTrigger.addEventListener('click', function() {
                imageUpload.click();
            });
            
            imageUpload.addEventListener('change', function(event) {
                const file = event.target.files[0];
                if (file) handleImageUpload(file);
            });
        }
    }
    
    function handlePostSubmission() {
        const postTextarea = document.getElementById('post-textarea');
        const content = postTextarea.value.trim();
        
        if (content.length === 0) return;
        
        // Create new post object
        const post = {
            id: 'post-' + (++postCounter),
            author: currentUser.name,
            avatar: currentUser.avatar,
            content: content,
            timestamp: new Date(),
            likes: 0,
            comments: 0,
            shares: 0,
            isLiked: false
        };
        
        // Add to DOM (prepend to top)
        addPostToFeed(post, true);
        
        // Reset Form
        postTextarea.value = '';
        const postButton = document.getElementById('post-button');
        postButton.disabled = true;
        postButton.classList.remove('active');
        
        // Clear Images
        clearImagePreview();
        
        // Success Animation
        const postForm = document.querySelector('.post-form');
        if (postForm) {
            postForm.classList.add('post-success');
            setTimeout(() => postForm.classList.remove('post-success'), 1000);
        }
    }
    
    function handleImageUpload(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }
        
        // Simple preview using ObjectURL
        const imgUrl = URL.createObjectURL(file);
        showImagePreview(imgUrl, file.name);
    }
    
    function showImagePreview(src, filename) {
        let previewContainer = document.getElementById('image-preview');
        
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'image-preview';
            previewContainer.className = 'image-preview-container';
            const postForm = document.querySelector('.post-form');
            if (postForm) postForm.appendChild(previewContainer);
        }
        
        previewContainer.innerHTML = `
            <div class="image-preview-item">
                <img src="${src}" alt="Preview" class="preview-image">
                <div class="preview-info">
                    <span class="preview-filename">${filename}</span>
                    <button class="preview-remove" aria-label="Remove image">×</button>
                </div>
            </div>`;
        
        previewContainer.style.display = 'block';
        
        // Handle remove click
        previewContainer.querySelector('.preview-remove').addEventListener('click', clearImagePreview);
    }
    
    function clearImagePreview() {
        const previewContainer = document.getElementById('image-preview');
        if (previewContainer) {
            previewContainer.style.display = 'none';
            previewContainer.innerHTML = '';
        }
        
        const imageUpload = document.getElementById('image-upload');
        if (imageUpload) imageUpload.value = '';
    }
    
    function addPostToFeed(post, prepend) {
        const feedContainer = document.querySelector('.posts-container');
        if (!feedContainer) return;

        const postElement = createPostElement(post);
        
        if (prepend) {
            feedContainer.insertBefore(postElement, feedContainer.firstChild);
            // Animation for new post
            postElement.classList.add('post-new');
            setTimeout(() => postElement.classList.remove('post-new'), 300);
        } else {
            feedContainer.appendChild(postElement);
        }
    }
    
    function createPostElement(post) {
        const timeAgo = formatTimeAgo(post.timestamp);
        
        const article = document.createElement('article');
        article.className = 'post-card';
        article.setAttribute('data-post-id', post.id);
        
        // Using Template Literals for cleaner HTML structure
        article.innerHTML = `
            <div class="post-header">
                <img src="${post.avatar}" alt="${post.author}" class="post-avatar">
                <div class="post-author-info">
                    <h4 class="post-author">${post.author}</h4>
                    <time class="post-time">${timeAgo}</time>
                </div>
                <button class="post-menu-btn" aria-label="Post options">
                    <span class="dots">⋯</span>
                </button>
            </div>
            <div class="post-content">
                <p>${post.content}</p>
            </div>
            <div class="post-actions">
                <button class="action-btn like-btn ${post.isLiked ? 'liked' : ''}" data-action="like">
                    <span class="action-icon">👍</span>
                    <span class="action-text">Like</span>
                    <span class="action-count">${post.likes > 0 ? post.likes : ''}</span>
                </button>
                <button class="action-btn comment-btn" data-action="comment">
                    <span class="action-icon">💬</span>
                    <span class="action-text">Comment</span>
                    <span class="action-count">${post.comments > 0 ? post.comments : ''}</span>
                </button>
                <button class="action-btn share-btn" data-action="share">
                    <span class="action-icon">📤</span>
                    <span class="action-text">Share</span>
                    <span class="action-count">${post.shares > 0 ? post.shares : ''}</span>
                </button>
            </div>
            <div class="post-comments" style="display: none;"></div>
        `;
        
        return article;
    }
    
    function setupNavigation() {
        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(event) {
                event.preventDefault();
                if (confirm('Are you sure you want to log out?')) {
                    window.location.href = 'login.html'; // Simple redirect
                }
            });
        }
        
        // Mobile Menu
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
    
    function setupSearch() {
        const searchInput = document.querySelector('.search-input');
        const searchButton = document.querySelector('.search-btn');
        
        if (searchInput) {
            let searchTimeout;
            
            // Search on input
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                const query = this.value.trim();
                
                searchTimeout = setTimeout(() => {
                    performSearch(query);
                }, 300);
            });
            
            // Search on button click
            if (searchButton) {
                searchButton.addEventListener('click', function() {
                    const query = searchInput.value.trim();
                    performSearch(query);
                });
            }
            
            // Search on Enter key
            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = this.value.trim();
                    performSearch(query);
                }
            });
        }
    }
    
    function performSearch(query) {
        const posts = document.querySelectorAll('.post-card');
        
        if (query.length === 0) {
            // Show all posts if search is empty
            posts.forEach(post => {
                post.style.display = '';
                post.classList.remove('search-highlight');
            });
            return;
        }
        
        const searchLower = query.toLowerCase();
        let foundCount = 0;
        
        posts.forEach(post => {
            const author = post.querySelector('.post-author')?.textContent.toLowerCase() || '';
            const content = post.querySelector('.post-content')?.textContent.toLowerCase() || '';
            
            if (author.includes(searchLower) || content.includes(searchLower)) {
                post.style.display = '';
                post.classList.add('search-highlight');
                foundCount++;
            } else {
                post.style.display = 'none';
                post.classList.remove('search-highlight');
            }
        });
        
        // Show search results feedback
        showSearchFeedback(query, foundCount);
    }
    
    function showSearchFeedback(query, count) {
        // Remove existing feedback
        const existingFeedback = document.querySelector('.search-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        // Add new feedback
        const feedContainer = document.querySelector('.posts-container');
        if (feedContainer && query.length > 0) {
            const feedback = document.createElement('div');
            feedback.className = 'search-feedback';
            feedback.style.cssText = `
                padding: 15px;
                margin-bottom: 15px;
                background: #f0f2f5;
                border-radius: 8px;
                text-align: center;
                color: #65676b;
                font-size: 14px;
            `;
            feedback.textContent = count > 0 
                ? `Found ${count} post${count === 1 ? '' : 's'} matching "${query}"` 
                : `No posts found matching "${query}"`;
            
            feedContainer.insertBefore(feedback, feedContainer.firstChild);
        }
    }
    
    function loadInitialPosts() {
        const samplePosts = [
            {
                id: 'post-sample-1',
                author: 'Shehab',
                avatar: 'images/default-avatar.jpg',
                content: 'Just finished an amazing project! Excited to share it with everyone soon. 🚀',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                likes: 15,
                comments: 3,
                shares: 2,
                isLiked: false
            },
            {
                id: 'post-sample-2',
                author: 'Pedri',
                avatar: 'images/default-avatar.jpg',
                content: 'Beautiful sunrise this morning! Sometimes you just need to stop and appreciate the little things in life. 🌅',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
                likes: 28,
                comments: 7,
                shares: 5,
                isLiked: false
            },
            {
                id: 'post-sample-3',
                author: 'Ismailla Sarr',
                avatar: 'images/default-avatar.jpg',
                content: 'Anyone else excited about the upcoming tech conference? #TechConf2024',
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
                likes: 42,
                comments: 12,
                shares: 8,
                isLiked: false
            }
        ];
        
        samplePosts.forEach(post => addPostToFeed(post, false));
    }
});
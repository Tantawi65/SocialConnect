/* ==========================================================================
   Profile Module
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    if (!window.location.pathname.includes('profile.html')) return;

    console.log('Profile JS Loaded');

    let currentUser = null;

    // --- 1. INITIALIZATION ---
    function init() {
        // Load User
        const stored = localStorage.getItem('user');
        currentUser = stored ? JSON.parse(stored) : {
            name: 'John Doe',
            avatar: 'images/default-avatar.jpg',
            coverPhoto: null,
            bio: 'Software Developer',
            work: 'Tech Co.',
            education: 'University',
            location: 'New York',
            hometown: 'Chicago',
            relationshipStatus: 'Single',
            friendsCount: 243,
            photosCount: 67,
            postsCount: 12
        };

        // Render
        updateAllVisuals();
        loadUserPosts(); // Helper to generate posts so we can test likes

        // Setup
        setupGlobalClicks();
        setupFormSaving();
        setupPhotoUploads();
        setupTabs();
        setupMobileMenu();
    }

    // --- 2. UPDATE VISUALS (The Sync Logic) ---
    function updateAllVisuals() {
        // A. Header Texts
        safeText('.profile-name', currentUser.name);
        safeText('.profile-bio', currentUser.bio);
        
        // B. Sidebar Info
        safeText('.work-info', currentUser.work);
        safeText('.education-info', currentUser.education);
        safeText('.location-info', currentUser.location);
        
        // C. Sidebar List (Specific Logic)
        const aboutList = document.querySelectorAll('.about-item p:last-child');
        if (aboutList.length >= 5) {
            aboutList[0].textContent = currentUser.work;
            aboutList[1].textContent = currentUser.education;
            aboutList[2].textContent = currentUser.location;
            aboutList[3].textContent = currentUser.hometown;
            aboutList[4].textContent = currentUser.relationshipStatus;
        }

        // D. Images (Everywhere)
        const allAvatars = document.querySelectorAll('.profile-avatar, .post-avatar, .user-avatar, .profile-picture img, #profile-picture');
        allAvatars.forEach(img => {
            img.src = currentUser.avatar;
            img.alt = currentUser.name;
        });

        const cover = document.querySelector('.cover-photo');
        if (cover && currentUser.coverPhoto) {
            cover.src = currentUser.coverPhoto;
        }

        // E. Update Post Authors
        document.querySelectorAll('.post-author').forEach(el => {
            el.textContent = currentUser.name;
        });
    }

    function safeText(selector, text) {
        const el = document.querySelector(selector);
        if (el) el.textContent = text || '';
    }

    // --- 3. GLOBAL CLICK HANDLER (Fixes Interactions) ---
    function setupGlobalClicks() {
        document.body.addEventListener('click', function(e) {
            const target = e.target;

            // --- LIKE BUTTON ---
            const likeBtn = target.closest('.like-btn');
            if (likeBtn) {
                e.preventDefault();
                likeBtn.classList.toggle('liked');
                
                // Find the likes count in the post stats section (separate from button)
                const post = likeBtn.closest('.post-card') || likeBtn.closest('.profile-post');
                const likesCountSpan = post?.querySelector('.likes-count');
                const icon = likeBtn.querySelector('.action-icon');
                
                let count = parseInt(likesCountSpan?.textContent?.match(/\d+/)?.[0] || '0') || 0;

                if (likeBtn.classList.contains('liked')) {
                    count++;
                    likeBtn.style.color = '#e74c3c'; // Red like home page
                    if (icon) icon.textContent = '❤️'; // Heart like home page
                } else {
                    count = Math.max(0, count - 1);
                    likeBtn.style.color = '';
                    if (icon) icon.textContent = '👍'; // Revert to thumbs up
                }
                if (likesCountSpan) {
                    likesCountSpan.textContent = count > 0 ? `${count} like${count === 1 ? '' : 's'}` : '0 likes';
                }
                return;
            }

            // --- COMMENT BUTTON ---
            const commentBtn = target.closest('.comment-btn');
            if (commentBtn) {
                e.preventDefault();
                const post = commentBtn.closest('.post-card') || commentBtn.closest('.profile-post');
                let section = post?.querySelector('.post-comments');
                
                // If no comment section exists, create one
                if (!section) {
                    section = document.createElement('div');
                    section.className = 'post-comments';
                    section.style.display = 'none';
                    post.appendChild(section);
                }
                
                // Toggle display
                const isHidden = window.getComputedStyle(section).display === 'none';
                section.style.display = isHidden ? 'block' : 'none';
                
                // Load comments interface if empty and now visible
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

            // --- OPEN EDIT MODAL ---
            if (target.closest('.edit-profile-btn') || target.closest('.edit-details-btn')) {
                e.preventDefault();
                openEditModal();
                return;
            }

            // --- CLOSE MODALS ---
            if (target.classList.contains('modal-backdrop') || target.closest('.modal-close-btn') || target.classList.contains('btn-cancel')) {
                e.preventDefault();
                document.querySelectorAll('.modal').forEach(m => {
                    m.classList.add('hidden');
                    m.style.display = 'none';
                });
            }
        });
    }

    // --- 4. SAVING PROFILE (Fixes "Refuses to Save") ---
    function setupFormSaving() {
        const saveBtn = document.querySelector('.btn-save');
        const form = document.getElementById('edit-profile-form');

        // Handler function
        const handleSave = (e) => {
            e.preventDefault();
            console.log('Saving profile...');

            // Helper to get value safely
            const val = (id) => {
                const el = document.getElementById(id);
                return el ? el.value : '';
            };

            // 1. Get values
            const fName = val('edit-first-name');
            const lName = val('edit-last-name');
            
            // 2. Update Object
            if (fName || lName) currentUser.name = `${fName} ${lName}`.trim();
            
            // Only update if field exists
            if (document.getElementById('edit-bio')) currentUser.bio = val('edit-bio');
            if (document.getElementById('edit-work')) currentUser.work = val('edit-work');
            if (document.getElementById('edit-education')) currentUser.education = val('edit-education');
            if (document.getElementById('edit-location')) currentUser.location = val('edit-location');
            if (document.getElementById('edit-hometown')) currentUser.hometown = val('edit-hometown');
            if (document.getElementById('edit-relationship-status')) currentUser.relationshipStatus = val('edit-relationship-status');

            // 3. Save to Storage
            localStorage.setItem('user', JSON.stringify(currentUser));

            // 4. Update UI
            updateAllVisuals();

            // 5. Close Modal
            const modal = document.getElementById('edit-profile-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }

            // Silent save - no alert
        };

        // Attach to Button AND Form
        if (saveBtn) saveBtn.addEventListener('click', handleSave);
        if (form) form.addEventListener('submit', handleSave);
    }

    function openEditModal() {
        const modal = document.getElementById('edit-profile-modal');
        if (!modal) return;

        // Pre-fill
        const names = currentUser.name.split(' ');
        const setVal = (id, v) => { 
            const el = document.getElementById(id); 
            if(el) el.value = v || ''; 
        };

        setVal('edit-first-name', names[0]);
        setVal('edit-last-name', names.slice(1).join(' '));
        setVal('edit-bio', currentUser.bio);
        setVal('edit-work', currentUser.work);
        setVal('edit-education', currentUser.education);
        setVal('edit-location', currentUser.location);
        setVal('edit-hometown', currentUser.hometown);
        setVal('edit-relationship-status', currentUser.relationshipStatus);

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }

    // --- 5. PHOTO UPLOADS ---
    function setupPhotoUploads() {
        const coverBtn = document.getElementById('edit-cover-btn');
        const profileBtn = document.getElementById('edit-picture-btn');

        // Inputs
        const coverInput = document.createElement('input'); coverInput.type = 'file';
        const profileInput = document.createElement('input'); profileInput.type = 'file';

        if (coverBtn) {
            coverInput.accept = 'image/*';
            coverBtn.addEventListener('click', (e) => { e.preventDefault(); coverInput.click(); });
            coverInput.addEventListener('change', () => {
                if (coverInput.files[0]) {
                    const file = coverInput.files[0];
                    if (file.type.startsWith('image/')) {
                        currentUser.coverPhoto = URL.createObjectURL(file);
                        saveAndRefresh();
                    } else {
                        alert('Please select an image file');
                    }
                }
            });
        }

        if (profileBtn) {
            profileInput.accept = 'image/*';
            profileBtn.addEventListener('click', (e) => { e.preventDefault(); profileInput.click(); });
            profileInput.addEventListener('change', () => {
                if (profileInput.files[0]) {
                    const file = profileInput.files[0];
                    if (file.type.startsWith('image/')) {
                        currentUser.avatar = URL.createObjectURL(file);
                        saveAndRefresh();
                    } else {
                        alert('Please select an image file');
                    }
                }
            });
        }
    }

    function saveAndRefresh() {
        localStorage.setItem('user', JSON.stringify(currentUser));
        updateAllVisuals();
    }

    // --- 6. TABS ---
    function setupTabs() {
        const btns = document.querySelectorAll('.posts-nav-btn');
        const sections = {
            'posts': document.getElementById('posts-content'),
            'about': document.querySelector('.about-section'),
            'friends': document.querySelector('.friends-section'),
            'photos': document.querySelector('.photos-section')
        };

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                Object.values(sections).forEach(s => { if(s) s.style.display = 'none'; });
                
                const target = btn.getAttribute('data-tab');
                if (sections[target]) sections[target].style.display = 'block';
            });
        });
    }

    // --- 7. HELPER: LOAD COMMENTS INTERFACE ---
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
                            <div class="comment-author" style="font-weight: 600; font-size: 13px; color: #050505; margin-bottom: 2px;">Demo User</div>
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
                
                // Update Count in the post stats section
                const post = container.closest('.post-card, .profile-post');
                const commentsCountSpan = post?.querySelector('.comments-count');
                if (commentsCountSpan) {
                    let c = parseInt(commentsCountSpan.textContent?.match(/\d+/)?.[0] || '0') || 0;
                    commentsCountSpan.textContent = `${c + 1} comment${c + 1 === 1 ? '' : 's'}`;
                }
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

    // --- 8. HELPER: LOAD POSTS ---
    function loadUserPosts() {
        const container = document.querySelector('.posts-list');
        if (!container) return;
        container.innerHTML = ''; 

        const posts = [
            { text: 'Profile update complete! 🚀', likes: 10, comments: 2, shares: 0 },
            { text: 'Hello world, this is my new profile.', likes: 25, comments: 5, shares: 1 }
        ];

        posts.forEach(p => {
            const html = `
            <div class="profile-post post-card">
                <div class="post-header">
                    <img src="${currentUser.avatar}" class="post-avatar">
                    <div class="post-info">
                        <h4 class="post-author">${currentUser.name}</h4>
                        <span class="post-time">Just now</span>
                    </div>
                </div>
                <div class="post-content"><p>${p.text}</p></div>
                <footer class="post-footer">
                    <div class="post-stats">
                        <span class="likes-count">${p.likes > 0 ? `${p.likes} like${p.likes === 1 ? '' : 's'}` : '0 likes'}</span>
                        <span class="comments-count">${p.comments > 0 ? `${p.comments} comment${p.comments === 1 ? '' : 's'}` : '0 comments'}</span>
                    </div>
                    
                    <div class="post-actions">
                        <button class="action-btn like-btn" type="button">
                            <span class="action-icon">👍</span>
                            <span class="action-text">Like</span>
                        </button>
                        <button class="action-btn comment-btn" type="button">
                            <span class="action-icon">💬</span>
                            <span class="action-text">Comment</span>
                        </button>
                        <button class="action-btn share-btn" type="button">
                            <span class="action-icon">📤</span>
                            <span class="action-text">Share</span>
                        </button>
                    </div>
                </footer>
                <div class="post-comments" style="display:none;"></div>
            </div>`;
            const d = document.createElement('div');
            d.innerHTML = html;
            container.appendChild(d.firstElementChild);
        });
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

    // Run Init
    init();
});
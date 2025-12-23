/* ==========================================================================
   Authentication Module - Connected to Django Backend
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // --- Global Auth Check ---
    // Check if we are on a protected page (not login/signup)
    const isAuthPage = window.location.pathname.includes('login.html') || 
                       window.location.pathname.includes('signup.html');
    
    const currentUser = localStorage.getItem('user');

    // If on a protected page and not logged in -> Redirect to Login
    if (!isAuthPage && !currentUser) {
        window.location.href = 'login.html';
        return; 
    }

    // If on login/signup page but already logged in -> Redirect to Index
    if (isAuthPage && currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // --- Page Initialization ---
    initAuthForms();
    setupLogout();

    function initAuthForms() {
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');

        // Login Logic
        if (loginForm) {
            setupDemoCredentials();
            
            loginForm.addEventListener('submit', async function(event) {
                event.preventDefault();
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const loginBtn = document.getElementById('login-btn');
                
                // Show loading state
                loginBtn.disabled = true;
                loginBtn.querySelector('.btn-text').textContent = 'Logging in...';
                
                try {
                    const response = await fetch('http://localhost:8000/api/auth/login/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email, password }),
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        // Store tokens and user data
                        localStorage.setItem('tokens', JSON.stringify(data.tokens));
                        localStorage.setItem('user', JSON.stringify(data.user));
                        
                        // Redirect to home
                        window.location.href = 'index.html';
                    } else {
                        // Show error
                        const errorMsg = data.non_field_errors ? data.non_field_errors[0] : 'Invalid credentials';
                        showNotification(errorMsg, 'error');
                        loginBtn.disabled = false;
                        loginBtn.querySelector('.btn-text').textContent = 'Log In';
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    showNotification('Connection error. Please try again.', 'error');
                    loginBtn.disabled = false;
                    loginBtn.querySelector('.btn-text').textContent = 'Log In';
                }
            });
        }

        // Signup Logic
        if (signupForm) {
            setupPasswordMatching();

            signupForm.addEventListener('submit', async function(event) {
                event.preventDefault();
                
                const firstName = document.getElementById('first-name').value;
                const lastName = document.getElementById('last-name').value;
                const email = document.getElementById('signup-email').value;
                const password = document.getElementById('signup-password').value;
                const birthMonth = document.getElementById('birth-month').value;
                const birthDay = document.getElementById('birth-day').value;
                const birthYear = document.getElementById('birth-year').value;
                const gender = document.querySelector('input[name="gender"]:checked')?.value;
                
                const signupBtn = document.getElementById('signup-btn');
                
                // Validation
                if (!firstName || !lastName || !email || !password) {
                    showNotification('Please fill in all required fields', 'error');
                    return;
                }
                
                if (password.length < 6) {
                    showNotification('Password must be at least 6 characters', 'error');
                    return;
                }
                
                if (!birthMonth || !birthDay || !birthYear) {
                    showNotification('Please provide your date of birth', 'error');
                    return;
                }
                
                if (!gender) {
                    showNotification('Please select your gender', 'error');
                    return;
                }
                
                // Create date of birth
                const dateOfBirth = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
                
                // Show loading state
                signupBtn.disabled = true;
                signupBtn.querySelector('.btn-text').textContent = 'Creating Account...';
                
                try {
                    const formData = new FormData();
                    formData.append('first_name', firstName);
                    formData.append('last_name', lastName);
                    formData.append('email', email);
                    formData.append('username', email.split('@')[0]);
                    formData.append('password', password);
                    formData.append('date_of_birth', dateOfBirth);
                    formData.append('gender', gender);
                    
                    const response = await fetch('http://localhost:8000/api/auth/register/', {
                        method: 'POST',
                        body: formData,
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        // Store tokens and user data
                        localStorage.setItem('tokens', JSON.stringify(data.tokens));
                        localStorage.setItem('user', JSON.stringify(data.user));
                        
                        showNotification('Account created successfully!', 'success');
                        
                        // Redirect to home
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 1000);
                    } else {
                        // Show error
                        let errorMsg = 'Registration failed. Please try again.';
                        if (data.email) {
                            errorMsg = data.email[0];
                        } else if (data.password) {
                            errorMsg = data.password[0];
                        }
                        showNotification(errorMsg, 'error');
                        signupBtn.disabled = false;
                        signupBtn.querySelector('.btn-text').textContent = 'Sign Up';
                    }
                } catch (error) {
                    console.error('Signup error:', error);
                    showNotification('Connection error. Please try again.', 'error');
                    signupBtn.disabled = false;
                    signupBtn.querySelector('.btn-text').textContent = 'Sign Up';
                }
            });
        }
        
        // Handle "Don't have an account?" links
        const gotoSignup = document.getElementById('goto-signup');
        if (gotoSignup) {
            gotoSignup.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'signup.html';
            });
        }
    }

    function setupLogout() {
        // Handle logout from dropdown menu
        const logoutLinks = document.querySelectorAll('a[href="login.html"]');
        logoutLinks.forEach(link => {
            if (link.textContent.includes('Logout')) {
                link.addEventListener('click', async function(e) {
                    e.preventDefault();
                    
                    if (confirm('Are you sure you want to log out?')) {
                        try {
                            const token = getAuthToken();
                            if (token) {
                                await fetch('http://localhost:8000/api/auth/logout/', {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                    },
                                });
                            }
                        } catch (error) {
                            console.error('Logout error:', error);
                        }
                        
                        // Clear local storage
                        localStorage.removeItem('tokens');
                        localStorage.removeItem('user');
                        window.location.href = 'login.html';
                    }
                });
            }
        });
    }

    function getAuthToken() {
        const tokens = localStorage.getItem('tokens');
        if (tokens) {
            const parsedTokens = JSON.parse(tokens);
            return parsedTokens.access;
        }
        return null;
    }

    function setupDemoCredentials() {
        const demoButton = document.getElementById('use-demo-credentials');
        
        if (demoButton) {
            demoButton.addEventListener('click', function(event) {
                event.preventDefault();
                
                const emailInput = document.getElementById('email');
                const passwordInput = document.getElementById('password');
                
                if (emailInput) emailInput.value = 'demo@socialconnect.com';
                if (passwordInput) passwordInput.value = 'demo123';
                
                showNotification('Demo credentials loaded!', 'success');
            });
        }
    }

    function setupPasswordMatching() {
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        if (passwordInput && confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', function() {
                const password = passwordInput.value;
                const confirmPassword = this.value;
                
                if (confirmPassword.length > 0) {
                    if (password === confirmPassword) {
                        this.classList.remove('error');
                        this.classList.add('success');
                    } else {
                        this.classList.remove('success');
                        this.classList.add('error');
                    }
                } else {
                    this.classList.remove('success', 'error');
                }
            });
        }
    }

    // Simple Notification Helper
    function showNotification(message, type) {
        // Create simple div
        const div = document.createElement('div');
        div.className = `notification notification-${type}`;
        div.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

        document.body.appendChild(div);

        // Remove after 3 seconds
        setTimeout(() => {
            if (div.parentNode) div.parentNode.removeChild(div);
        }, 3000);

        // Close button click
        div.querySelector('.notification-close').addEventListener('click', () => {
             if (div.parentNode) div.parentNode.removeChild(div);
        });
    }
});
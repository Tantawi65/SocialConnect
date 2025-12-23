/**
 * API Configuration for Social Connect
 * This file contains the base URL and helper functions for API calls
 */

// API Base URL - Update this if your backend runs on a different port
const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Get the authentication token from localStorage
 */
function getAuthToken() {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
        const parsedTokens = JSON.parse(tokens);
        return parsedTokens.access;
    }
    return null;
}

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (e.g., '/posts/')
 * @param {object} options - Fetch options
 */
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Token expired or invalid - redirect to login
        localStorage.removeItem('tokens');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        throw new Error('Unauthorized');
    }

    return response;
}

/**
 * Make an authenticated API request with FormData (for file uploads)
 * @param {string} endpoint - API endpoint
 * @param {FormData} formData - Form data to send
 * @param {string} method - HTTP method (POST, PUT, etc.)
 */
async function apiRequestWithFile(endpoint, formData, method = 'POST') {
    const token = getAuthToken();
    const headers = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: method,
        headers: headers,
        body: formData,
    });

    if (response.status === 401) {
        localStorage.removeItem('tokens');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        throw new Error('Unauthorized');
    }

    return response;
}

/**
 * Get the full media URL
 * @param {string} path - Relative media path
 */
function getMediaUrl(path) {
    if (!path) return 'images/default-avatar.jpg';
    if (path.startsWith('http')) return path;
    return path;
}

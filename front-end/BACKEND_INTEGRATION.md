# Social Connect - Frontend Integration Guide

This guide explains how the frontend connects to the Django backend.

## Setup

1. **Ensure Backend is Running**
   - The backend must be running on `http://localhost:8000`
   - See backend/README.md for setup instructions

2. **API Configuration**
   - API base URL is configured in `js/api-config.js`
   - Default: `http://localhost:8000/api`

## Authentication Flow

### Registration (signup.html)
1. User fills out signup form with:
   - First name, last name
   - Email, password
   - Date of birth (month, day, year)
   - Gender
   - Optional: Profile photo

2. Form submits to `POST /api/auth/register/`
3. Backend creates user with default profile/cover photos if none provided
4. Returns JWT tokens and user data
5. Tokens stored in localStorage
6. User redirected to home page

### Login (login.html)
1. User enters email and password
2. Form submits to `POST /api/auth/login/`
3. Backend validates credentials
4. Returns JWT tokens and user data
5. Tokens stored in localStorage
6. User redirected to home page

### Logout
1. User clicks logout link
2. Frontend sends `POST /api/auth/logout/`
3. Clears localStorage
4. Redirects to login page

## API Integration

### Using the API Helper Functions

The `api-config.js` file provides helper functions:

```javascript
// Make authenticated GET request
const response = await apiRequest('/posts/', {
    method: 'GET'
});
const posts = await response.json();

// Make authenticated POST request
const response = await apiRequest('/posts/', {
    method: 'POST',
    body: JSON.stringify({ content: 'Hello!' })
});

// Upload file (profile photo, post image)
const formData = new FormData();
formData.append('photo', fileInput.files[0]);
const response = await apiRequestWithFile('/users/upload_profile_photo/', formData);
```

### Authentication Headers

All API requests (except login/register) require JWT token in header:
```
Authorization: Bearer <access_token>
```

This is handled automatically by `apiRequest()` function.

## Key Features Integration

### Posts Feed (index.html)
- **Load Posts**: `GET /api/posts/` - Returns feed of posts
- **Create Post**: `POST /api/posts/` - Create new post with content and optional image
- **Like Post**: `POST /api/posts/{id}/like/` - Like a post
- **Unlike Post**: `POST /api/posts/{id}/unlike/` - Unlike a post
- **Comment**: `POST /api/posts/{id}/comment/` - Add comment to post
- **Get Comments**: `GET /api/posts/{id}/comments/` - Get all comments

### Profile (profile.html)
- **Get Profile**: `GET /api/users/me/` - Get current user profile
- **Update Profile**: `PUT /api/users/update_profile/` - Update bio, work, education, etc.
- **Upload Profile Photo**: `POST /api/users/upload_profile_photo/` - Upload profile picture
- **Upload Cover Photo**: `POST /api/users/upload_cover_photo/` - Upload cover image
- **User Posts**: `GET /api/posts/?author={user_id}` - Get user's posts

### Messages (messages.html)
- **Get Conversations**: `GET /api/conversations/` - List all conversations
- **Start Conversation**: `POST /api/conversations/start_conversation/` - Start chat with user
- **Get Messages**: `GET /api/conversations/{id}/messages/` - Get conversation messages
- **Send Message**: `POST /api/conversations/{id}/send_message/` - Send a message
- **Mark as Read**: `POST /api/messages/{id}/mark_as_read/` - Mark message as read

### Friends
- **Get Friends**: `GET /api/friends/` - List user's friends
- **Friend Requests**: `GET /api/friend-requests/` - Get pending friend requests
- **Send Request**: `POST /api/friend-requests/send/{user_id}/` - Send friend request
- **Accept Request**: `POST /api/friend-requests/{id}/accept/` - Accept friend request
- **Reject Request**: `POST /api/friend-requests/{id}/reject/` - Reject friend request

## Default Images

When a user registers without a profile photo:
- Backend automatically uses `/media/defaults/default-avatar.jpg`
- Backend automatically uses `/media/defaults/default-cover.jpg`

The serializers return full URLs for images, so frontend can display them directly.

## File Uploads

### Profile/Cover Photos
```javascript
const formData = new FormData();
formData.append('photo', fileInput.files[0]);

const response = await apiRequestWithFile('/users/upload_profile_photo/', formData);
const userData = await response.json();
// userData.profile_photo_url contains the new photo URL
```

### Post Images
```javascript
const formData = new FormData();
formData.append('content', 'Check out this photo!');
formData.append('image', fileInput.files[0]);
formData.append('privacy', 'public');

const response = await apiRequestWithFile('/posts/', formData);
```

## Error Handling

The API helper functions automatically handle:
- **401 Unauthorized**: Clears tokens and redirects to login
- **Network Errors**: Can be caught with try/catch

Example:
```javascript
try {
    const response = await apiRequest('/posts/', { method: 'GET' });
    const posts = await response.json();
} catch (error) {
    console.error('Error loading posts:', error);
    showNotification('Failed to load posts', 'error');
}
```

## LocalStorage Structure

### Tokens
```javascript
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### User Data
```javascript
{
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "profile_photo_url": "http://localhost:8000/media/profile_photos/photo.jpg",
    "cover_photo_url": "http://localhost:8000/media/cover_photos/cover.jpg",
    "bio": "Software Developer",
    "work": "Tech Co.",
    "education": "University",
    "location": "New York",
    // ... other fields
}
```

## Testing the Integration

1. Start the backend server:
   ```powershell
   cd backend
   python manage.py runserver
   ```

2. Open frontend in browser:
   ```
   file:///path/to/front-end/login.html
   ```

3. Test registration:
   - Fill out signup form
   - Check browser console for API calls
   - Verify user created in Django admin

4. Test login:
   - Use registered credentials
   - Should redirect to home page
   - Check localStorage for tokens

5. Test posts:
   - Create a new post
   - Like/comment on posts
   - Verify in Django admin

## CORS Configuration

The backend is configured to allow all origins in development:
```python
CORS_ALLOW_ALL_ORIGINS = True
```

For production, update `backend/social_connect/settings.py` to specify allowed origins.

## Troubleshooting

### "Failed to fetch" errors
- Ensure backend is running on port 8000
- Check browser console for CORS errors
- Verify API_BASE_URL in api-config.js

### 401 Unauthorized
- Token may be expired or invalid
- Try logging in again
- Check that Authorization header is being sent

### Images not loading
- Ensure media files are being served (backend DEBUG=True)
- Check that default images exist in backend/media/defaults/
- Verify image URLs in API responses

### Database errors
- Run migrations: `python manage.py migrate`
- Check for model changes that need new migrations

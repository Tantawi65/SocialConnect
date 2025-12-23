# API Testing Guide - Social Connect

Use these examples to test the API endpoints with tools like Postman, curl, or the browser console.

## Base URL
```
http://localhost:8000/api
```

## 1. Authentication Endpoints

### Register New User
```http
POST /api/auth/register/
Content-Type: multipart/form-data

Body:
- first_name: John
- last_name: Doe
- email: john@example.com
- username: johndoe
- password: password123
- date_of_birth: 1995-05-15
- gender: male
- profile_photo: [file] (optional)
```

Response:
```json
{
    "user": {
        "id": 1,
        "email": "john@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "full_name": "John Doe",
        "profile_photo_url": "http://localhost:8000/media/defaults/default-avatar.jpg",
        "cover_photo_url": "http://localhost:8000/media/defaults/default-cover.jpg",
        ...
    },
    "tokens": {
        "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
    }
}
```

### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "password123"
}
```

### Get Current User
```http
GET /api/auth/me/
Authorization: Bearer {access_token}
```

### Logout
```http
POST /api/auth/logout/
Authorization: Bearer {access_token}
```

## 2. User/Profile Endpoints

### Get User Profile
```http
GET /api/users/me/
Authorization: Bearer {access_token}
```

### Update Profile
```http
PUT /api/users/update_profile/
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "bio": "Software Developer & Coffee Lover",
    "work": "Tech Company",
    "education": "University of Example",
    "location": "New York, NY",
    "hometown": "Chicago, IL",
    "relationship_status": "Single"
}
```

### Upload Profile Photo
```http
POST /api/users/upload_profile_photo/
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

Body:
- photo: [file]
```

### Upload Cover Photo
```http
POST /api/users/upload_cover_photo/
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

Body:
- photo: [file]
```

### Search Users
```http
GET /api/users/?search=john
Authorization: Bearer {access_token}
```

## 3. Post Endpoints

### Get Feed (All Posts)
```http
GET /api/posts/
Authorization: Bearer {access_token}
```

### Create Post (Text Only)
```http
POST /api/posts/
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "content": "Hello, this is my first post!",
    "privacy": "public"
}
```

### Create Post (With Image)
```http
POST /api/posts/
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

Body:
- content: Check out this amazing photo!
- image: [file]
- privacy: public
```

### Get Single Post
```http
GET /api/posts/{post_id}/
Authorization: Bearer {access_token}
```

### Update Post
```http
PUT /api/posts/{post_id}/
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "content": "Updated post content",
    "privacy": "friends"
}
```

### Delete Post
```http
DELETE /api/posts/{post_id}/
Authorization: Bearer {access_token}
```

### Like a Post
```http
POST /api/posts/{post_id}/like/
Authorization: Bearer {access_token}
```

### Unlike a Post
```http
POST /api/posts/{post_id}/unlike/
Authorization: Bearer {access_token}
```

### Comment on Post
```http
POST /api/posts/{post_id}/comment/
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "content": "Great post!"
}
```

### Get Post Comments
```http
GET /api/posts/{post_id}/comments/
Authorization: Bearer {access_token}
```

### Share a Post
```http
POST /api/posts/{post_id}/share/
Authorization: Bearer {access_token}
```

## 4. Friend Endpoints

### Get Friends List
```http
GET /api/friends/
Authorization: Bearer {access_token}
```

### Get Friend Requests
```http
GET /api/friend-requests/
Authorization: Bearer {access_token}
```

### Send Friend Request
```http
POST /api/friend-requests/send/{user_id}/
Authorization: Bearer {access_token}
```

### Accept Friend Request
```http
POST /api/friend-requests/{request_id}/accept/
Authorization: Bearer {access_token}
```

### Reject Friend Request
```http
POST /api/friend-requests/{request_id}/reject/
Authorization: Bearer {access_token}
```

## 5. Messaging Endpoints

### Get All Conversations
```http
GET /api/conversations/
Authorization: Bearer {access_token}
```

### Start New Conversation
```http
POST /api/conversations/start_conversation/
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "participant_id": 2
}
```

### Get Messages in Conversation
```http
GET /api/conversations/{conversation_id}/messages/
Authorization: Bearer {access_token}
```

### Send Message
```http
POST /api/conversations/{conversation_id}/send_message/
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "content": "Hello! How are you?"
}
```

### Send Message with Image
```http
POST /api/conversations/{conversation_id}/send_message/
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

Body:
- content: Check this out!
- image: [file]
```

### Mark Message as Read
```http
POST /api/messages/{message_id}/mark_as_read/
Authorization: Bearer {access_token}
```

## Browser Console Testing

You can test the API from the browser console when logged in:

```javascript
// Get access token
const token = JSON.parse(localStorage.getItem('tokens')).access;

// Make API call
fetch('http://localhost:8000/api/posts/', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
})
.then(r => r.json())
.then(data => console.log(data));

// Create a post
fetch('http://localhost:8000/api/posts/', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        content: 'Testing from console!',
        privacy: 'public'
    })
})
.then(r => r.json())
.then(data => console.log(data));
```

## Common Response Codes

- `200 OK` - Successful GET, PUT, DELETE
- `201 Created` - Successful POST (resource created)
- `400 Bad Request` - Invalid data in request
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Server error

## Testing Workflow

1. **Register a user** - Get access token
2. **Create a few posts** - Test post creation
3. **Like and comment** - Test interactions
4. **Update profile** - Test profile endpoints
5. **Register another user** - Test social features
6. **Send friend request** - Test friendship
7. **Start conversation** - Test messaging
8. **Send messages** - Test messaging flow

## Postman Collection

You can import these endpoints into Postman:

1. Create a new collection "Social Connect API"
2. Add environment variable `base_url` = `http://localhost:8000/api`
3. Add environment variable `token` = (get from login response)
4. Create requests for each endpoint above
5. Use `{{base_url}}` and `{{token}}` in your requests

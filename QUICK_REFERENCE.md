# 🚀 Social Connect - Quick Reference

## Start the Application

```powershell
# One command to start everything
.\start.ps1

# OR manually:
# Terminal 1 - Backend
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver

# Terminal 2 - Frontend
cd front-end
python -m http.server 8080
```

**Access**: `http://localhost:8080/login.html`

---

## Common Commands

### Backend
```powershell
cd backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Make migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver

# Open Django shell
python manage.py shell
```

### Database
```powershell
# Reset database (CAUTION: Deletes all data)
cd backend
Remove-Item db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

---

## API Quick Reference

### Base URL
```
http://localhost:8000/api
```

### Headers
```javascript
{
    "Authorization": "Bearer <access_token>",
    "Content-Type": "application/json"
}
```

### Key Endpoints

**Auth**
- POST `/auth/register/` - Register
- POST `/auth/login/` - Login  
- GET `/auth/me/` - Current user

**Posts**
- GET `/posts/` - Feed
- POST `/posts/` - Create
- POST `/posts/{id}/like/` - Like
- POST `/posts/{id}/comment/` - Comment

**Profile**
- GET `/users/me/` - My profile
- PUT `/users/update_profile/` - Update
- POST `/users/upload_profile_photo/` - Upload photo

**Friends**
- GET `/friends/` - Friends list
- POST `/friend-requests/send/{id}/` - Send request
- POST `/friend-requests/{id}/accept/` - Accept

**Messages**
- GET `/conversations/` - All chats
- POST `/conversations/start_conversation/` - New chat
- POST `/conversations/{id}/send_message/` - Send

---

## Frontend API Usage

### Make API Call
```javascript
// Get feed
const response = await apiRequest('/posts/', {
    method: 'GET'
});
const posts = await response.json();

// Create post
const response = await apiRequest('/posts/', {
    method: 'POST',
    body: JSON.stringify({
        content: 'Hello!',
        privacy: 'public'
    })
});
```

### Upload File
```javascript
const formData = new FormData();
formData.append('photo', fileInput.files[0]);

const response = await apiRequestWithFile(
    '/users/upload_profile_photo/',
    formData
);
```

### Get Current User
```javascript
const user = JSON.parse(localStorage.getItem('user'));
const tokens = JSON.parse(localStorage.getItem('tokens'));
```

---

## File Structure

```
backend/
├── api/
│   ├── models.py          # Database models
│   ├── serializers.py     # DRF serializers
│   ├── views.py           # API views
│   ├── urls.py            # API routes
│   └── admin.py           # Admin config
├── social_connect/
│   ├── settings.py        # Django settings
│   └── urls.py            # Main routes
├── media/                 # Uploaded files
└── manage.py

front-end/
├── index.html             # Home/Feed
├── login.html             # Login page
├── signup.html            # Registration
├── profile.html           # User profile
├── messages.html          # Messaging
├── js/
│   ├── api-config.js      # API helpers
│   ├── auth.js            # Auth logic
│   ├── dynamic-home.js    # Feed logic
│   ├── profile.js         # Profile logic
│   └── messages.js        # Chat logic
└── css/                   # Stylesheets
```

---

## Database Models

1. **User** - Custom user with photos
2. **Post** - Social media posts
3. **Comment** - Post comments
4. **Like** - Post likes
5. **Share** - Post shares
6. **Friendship** - User connections
7. **FriendRequest** - Pending requests
8. **Conversation** - Message threads
9. **Message** - Direct messages

---

## Admin Panel

**URL**: `http://localhost:8000/admin/`

**Login**: Use superuser credentials

**Features**:
- View/edit all users
- View/edit all posts
- Manage comments, likes
- View messages
- User administration

---

## LocalStorage Data

**tokens**
```json
{
    "access": "eyJ0eXAi...",
    "refresh": "eyJ0eXAi..."
}
```

**user**
```json
{
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "profile_photo_url": "http://...",
    ...
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 8000 in use | Kill process or use different port |
| CORS error | Check backend is running, CORS enabled |
| 401 Unauthorized | Token expired, login again |
| Migration error | Delete db.sqlite3, run migrate |
| Import error | Activate venv, install requirements |
| Images not showing | Copy defaults, check media path |

---

## Development Tips

### Test API in Console
```javascript
// After logging in, open browser console:
const token = JSON.parse(localStorage.getItem('tokens')).access;

fetch('http://localhost:8000/api/posts/', {
    headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(console.log);
```

### Create Test Data
```python
# In Django shell (python manage.py shell)
from api.models import User, Post

# Create user
user = User.objects.create_user(
    email='test@test.com',
    username='testuser',
    password='password123',
    first_name='Test',
    last_name='User'
)

# Create post
post = Post.objects.create(
    author=user,
    content='Test post',
    privacy='public'
)
```

---

## Environment

**Backend**
- Python 3.x
- Django 4.2
- DRF 3.14
- SQLite

**Frontend**
- Vanilla JavaScript
- No build tools
- ES6+ syntax

---

## Next Integration Steps

1. **Connect Post Creation** (dynamic-home.js)
   ```javascript
   // In submitPost function
   const formData = new FormData();
   formData.append('content', content);
   formData.append('privacy', 'public');
   if (imageFile) formData.append('image', imageFile);
   
   const response = await apiRequestWithFile('/posts/', formData);
   ```

2. **Load Feed** (dynamic-home.js)
   ```javascript
   // On page load
   const response = await apiRequest('/posts/');
   const posts = await response.json();
   // Render posts
   ```

3. **Connect Profile Updates** (profile.js)
   ```javascript
   const response = await apiRequest('/users/update_profile/', {
       method: 'PUT',
       body: JSON.stringify(profileData)
   });
   ```

---

## Documentation Files

- `README.md` - Main overview
- `backend/README.md` - Backend guide
- `BACKEND_INTEGRATION.md` - Frontend integration
- `API_TESTING.md` - API testing guide
- `PROJECT_SUMMARY.md` - What was built
- `TESTING_CHECKLIST.md` - Test checklist
- `QUICK_REFERENCE.md` - This file

---

## URLs at a Glance

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080/login.html |
| Backend API | http://localhost:8000/api/ |
| Admin Panel | http://localhost:8000/admin/ |
| API Docs | See API_TESTING.md |

---

**Quick Start**: Run `.\start.ps1` from project root! 🚀

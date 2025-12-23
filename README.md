# Social Connect - Django Social Media Platform

A clean, template-based social media platform built with Django.

## ✨ Features

- **User Authentication**: Sign up, login, logout with profile photo upload
- **User Profiles**: Customizable profiles with bio, location, website, profile and cover photos
- **Posts**: Create posts with text and images
- **Social Interactions**: Like and comment on posts
- **Friends System**: Send and accept friend requests
- **Messaging**: Private conversations between users (non-realtime)
- **Default Images**: Automatic fallback to default profile/cover photos

## 📁 Project Structure

```
Final-project/
├── social_connect/          # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── core/                    # Main application
│   ├── models.py           # Database models (User, Post, Comment, etc.)
│   ├── views.py            # View functions
│   ├── urls.py             # URL routing
│   └── admin.py            # Admin configuration
├── templates/               # HTML templates
│   ├── login.html
│   ├── signup.html
│   ├── index.html          # Home feed
│   ├── profile.html        # User profile
│   ├── messages.html       # Conversations list
│   └── conversation.html   # Chat view
├── static/                  # Static files
│   └── css/                # CSS stylesheets
├── media/                   # User uploads
│   └── defaults/           # Default images
├── manage.py
└── db.sqlite3              # Database
```

## 🚀 Getting Started

### Server is Already Running!
The Django development server is running at: **http://127.0.0.1:8000/**

### Create Your First Account
1. Open your browser and go to: **http://127.0.0.1:8000/signup/**
2. Fill in the registration form:
   - Username
   - Email
   - Password
   - Confirm Password
   - Profile Photo (optional - defaults will be used if not provided)
3. Click "Sign Up"

### Start Using the Platform
After signing up, you'll be automatically logged in and can:
- ✅ Create posts with text and images
- ✅ View and edit your profile
- ✅ Add friends
- ✅ Send messages
- ✅ Like and comment on posts

## 🗄️ Database Models

### User
Extended Django's AbstractUser with:
- `username`, `email`, `password`
- `bio`, `profile_photo`, `cover_photo`
- `location`, `website`, `date_of_birth`
- Methods: `get_profile_photo_url()`, `get_cover_photo_url()`

### Post
- `user`, `content`, `image`
- `created_at`, `updated_at`

### Comment
- `post`, `user`, `content`, `created_at`

### Like
- `post`, `user`, `created_at`

### Friendship
- `user`, `friend`, `created_at`

### FriendRequest
- `from_user`, `to_user`, `created_at`

### Conversation
- `participants` (ManyToMany)
- `created_at`, `updated_at`

### Message
- `conversation`, `sender`, `content`
- `created_at`, `is_read`

## 🔗 Key URLs

| URL | Description |
|-----|-------------|
| `/` | Home feed (requires login) |
| `/signup/` | Registration page |
| `/login/` | Login page |
| `/logout/` | Logout |
| `/profile/` | Your profile |
| `/profile/<username>/` | View other user's profile |
| `/messages/` | View all conversations |
| `/conversation/<id>/` | View specific conversation |
| `/admin/` | Django admin panel |

## 🛠️ Development Commands

### Stop the Server
Press `CTRL+C` in the terminal where server is running

### Start the Server
```bash
.\venv\Scripts\python.exe manage.py runserver
```

### Make Database Changes
```bash
.\venv\Scripts\python.exe manage.py makemigrations
.\venv\Scripts\python.exe manage.py migrate
```

### Create Admin User
```bash
.\venv\Scripts\python.exe manage.py createsuperuser
```

Then access admin at: http://127.0.0.1:8000/admin/

## 💡 Key Features Explained

### Default Images
When users register without uploading photos:
- Profile photo defaults to `media/defaults/default-profile.jpg`
- Cover photo defaults to `media/defaults/default-cover.jpg`

### Non-Realtime Messaging
Messages are stored in the database and displayed on page load. Refresh to see new messages - no WebSocket required.

### Friend System Flow
1. User A sends friend request to User B
2. User B sees the request and can accept it
3. Friendship is created bidirectionally
4. Both users now see each other's posts in their feed

## 🎯 Clean Implementation

This is a fresh Django project with:
- ✅ No sample/template data
- ✅ Clean, empty initial state
- ✅ Dynamic content from database
- ✅ Django templates with proper template tags
- ✅ Original CSS design preserved
- ✅ Proper Django architecture

## 🧪 Testing the Platform

### Test Basic Functionality
1. **Sign up** at http://127.0.0.1:8000/signup/
2. **Create a post** from the home page
3. **Edit your profile** - add bio, location, upload photos
4. **Like your own post** to test the like system
5. **Comment on your post**

### Test Social Features
1. **Open incognito/private browser window**
2. **Create second account** with different username
3. **View first user's profile** by going to `/profile/<username>/`
4. **Send friend request**
5. **Switch back to first account**, accept request
6. **Send message** to new friend
7. **Check both accounts** to see posts appearing in feed

## 🎨 Customization

All CSS files are in `static/css/`:
- `main.css` - Global styles
- `auth.css` - Login/signup pages
- `home.css` - Home feed
- `profile.css` - Profile pages
- `messages.css` - Messaging interface

## 📝 Notes

- Database: SQLite (stored in `db.sqlite3`)
- Media files uploaded to: `media/profiles/`, `media/covers/`, `media/posts/`
- Default images in: `media/defaults/`
- Virtual environment in: `venv/` (activated automatically by commands above)

## 🎉 You're Ready!

Go to **http://127.0.0.1:8000/signup/** and start building your social network!

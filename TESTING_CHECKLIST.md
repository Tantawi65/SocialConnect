# Social Connect - Testing Checklist

Use this checklist to verify that everything is working correctly.

## Initial Setup ✅

- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Database created (`python manage.py migrate`)
- [ ] Default images copied to `backend/media/defaults/`
- [ ] Superuser created (`python manage.py createsuperuser`)
- [ ] Backend server running on port 8000
- [ ] Frontend accessible (via file:// or http://localhost:8080)

## Backend Tests 🔧

### Admin Panel
- [ ] Can access admin panel at `http://localhost:8000/admin/`
- [ ] Can log in with superuser credentials
- [ ] Can see all models (User, Post, Comment, Like, Share, etc.)
- [ ] Can create/edit/delete users from admin

### API Endpoints (Test with Postman or curl)
- [ ] `GET /api/` returns API root
- [ ] `POST /api/auth/register/` creates new user
- [ ] `POST /api/auth/login/` returns JWT tokens
- [ ] `GET /api/auth/me/` returns current user (with token)
- [ ] `GET /api/posts/` returns empty array or posts (with token)

## Frontend Tests 🎨

### Registration Flow
- [ ] Can access signup page
- [ ] Form validates required fields
- [ ] First name validation works
- [ ] Last name validation works
- [ ] Email validation works
- [ ] Password minimum length (6 chars) enforced
- [ ] Date of birth required
- [ ] Gender selection required
- [ ] Can submit form without photo (uses default)
- [ ] Can submit form with photo (uploads successfully)
- [ ] Success shows and redirects to home
- [ ] User data stored in localStorage
- [ ] JWT tokens stored in localStorage

### Login Flow
- [ ] Can access login page
- [ ] Form validates email format
- [ ] Form validates password required
- [ ] Invalid credentials show error message
- [ ] Valid credentials log user in
- [ ] JWT tokens stored in localStorage
- [ ] User data stored in localStorage
- [ ] Redirects to home page after login
- [ ] Cannot access login page when already logged in (redirects to home)

### Authentication Persistence
- [ ] Logged in user stays logged in on page refresh
- [ ] Cannot access home/profile/messages without login
- [ ] Attempting to access protected page redirects to login
- [ ] After login, redirected back to home

### Logout Flow
- [ ] Can click logout from dropdown menu
- [ ] Confirmation dialog appears
- [ ] Choosing "Yes" logs out user
- [ ] Tokens removed from localStorage
- [ ] Redirected to login page
- [ ] Cannot access protected pages after logout

## Integration Tests 🔗

### User Registration → Login → Home
- [ ] Register new user "Test User 1"
- [ ] Verify tokens received
- [ ] Verify redirected to home
- [ ] Verify navbar shows user info
- [ ] Logout
- [ ] Login with same credentials
- [ ] Verify successful login

### Multiple Users
- [ ] Register "User 1" 
- [ ] Logout
- [ ] Register "User 2"
- [ ] Logout
- [ ] Login as "User 1"
- [ ] Verify correct user shown
- [ ] Logout
- [ ] Login as "User 2"
- [ ] Verify correct user shown

### Photo Upload on Registration
- [ ] Select profile photo during signup
- [ ] Submit form
- [ ] Check Django admin - verify photo uploaded
- [ ] Check user object - profile_photo field has value
- [ ] Login and verify photo displayed (if connected)

### Default Images
- [ ] Register without photo
- [ ] Check API response - profile_photo_url points to default
- [ ] Check API response - cover_photo_url points to default
- [ ] Verify default images exist in `media/defaults/`

## API Integration Tests (Browser Console) 🧪

### Test API Calls from Console
Open browser console on home page after login:

```javascript
// 1. Verify token exists
const tokens = JSON.parse(localStorage.getItem('tokens'));
console.log('Access Token:', tokens.access);

// 2. Test getting current user
fetch('http://localhost:8000/api/auth/me/', {
    headers: { 'Authorization': `Bearer ${tokens.access}` }
})
.then(r => r.json())
.then(data => console.log('Current User:', data));

// 3. Test creating a post
fetch('http://localhost:8000/api/posts/', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${tokens.access}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        content: 'My first post from console!',
        privacy: 'public'
    })
})
.then(r => r.json())
.then(data => console.log('Created Post:', data));

// 4. Test getting feed
fetch('http://localhost:8000/api/posts/', {
    headers: { 'Authorization': `Bearer ${tokens.access}` }
})
.then(r => r.json())
.then(data => console.log('Feed:', data));
```

Expected results:
- [ ] Current user data returned
- [ ] Post created successfully
- [ ] Post appears in feed
- [ ] All requests return 200/201 status

## Database Tests 💾

### Check via Django Admin
- [ ] User count increases after each registration
- [ ] Users have correct email, name, DOB, gender
- [ ] Users without uploaded photo have NULL profile_photo
- [ ] Default images work when displaying users

### Check via Django Shell
```python
python manage.py shell

from api.models import User
User.objects.all()  # Should show all registered users
User.objects.get(email='test@example.com')  # Get specific user
```

- [ ] Can query users
- [ ] User data correct
- [ ] Can access user.profile_photo_url
- [ ] Can access user.cover_photo_url

## Error Handling Tests ⚠️

### Registration Errors
- [ ] Submit empty form - shows validation errors
- [ ] Email already exists - shows error
- [ ] Password too short - shows error
- [ ] Invalid email format - shows error
- [ ] Missing date of birth - shows error
- [ ] Missing gender - shows error

### Login Errors
- [ ] Wrong email - shows error
- [ ] Wrong password - shows error
- [ ] Email doesn't exist - shows error
- [ ] Empty fields - shows validation errors

### Token Expiration
- [ ] Delete tokens from localStorage
- [ ] Try to access API endpoint
- [ ] Should redirect to login (401 handled)

## Performance Tests ⚡

- [ ] Registration completes in < 2 seconds
- [ ] Login completes in < 1 second
- [ ] API calls respond in < 500ms
- [ ] Images load properly
- [ ] No console errors on any page

## Browser Compatibility 🌐

Test in multiple browsers:
- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari (if available)

Verify:
- [ ] All pages load
- [ ] Registration works
- [ ] Login works
- [ ] Logout works

## Security Tests 🔒

- [ ] Cannot access API without token (401 error)
- [ ] Cannot view other users' private data
- [ ] Tokens stored securely in localStorage
- [ ] Passwords not visible in network requests
- [ ] CORS properly configured

## Final Verification ✅

- [ ] README.md instructions accurate
- [ ] setup.ps1 script works
- [ ] start.ps1 script works
- [ ] All documentation up to date
- [ ] No console errors on any page
- [ ] No backend errors in terminal

## Known Limitations 📝

Note: These features have backend support but frontend needs connection:
- Creating posts (backend ready, needs frontend JS)
- Liking posts (backend ready, needs frontend JS)
- Commenting (backend ready, needs frontend JS)
- Messaging (backend ready, needs frontend JS)
- Friend requests (backend ready, needs frontend JS)
- Profile updates (backend ready, needs frontend JS)

## Test Results Summary

Date Tested: _______________
Tested By: _______________

Total Tests: ___ / ___
Passed: ___
Failed: ___

Critical Issues: _______________
Minor Issues: _______________
Notes: _______________

---

## Quick Test Commands

### Backend
```powershell
# Run migrations
cd backend
python manage.py migrate

# Create test superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Frontend
```powershell
# Start simple server
cd front-end
python -m http.server 8080
```

### Both
```powershell
# From project root
.\start.ps1
```

---

**Remember**: The backend is 100% complete and functional. All API endpoints work. The authentication (login/register/logout) is fully integrated with the frontend. Other features need frontend JavaScript updates to connect to the existing API.

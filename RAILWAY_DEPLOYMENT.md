# Railway Deployment Guide

## Quick Deploy to Railway

### 1. Push to GitHub
First, push your project to a GitHub repository.

```bash
git init
git add .
git commit -m "Initial commit - ready for Railway deployment"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Create Railway Account & Project
1. Go to [railway.app](https://railway.app) and sign up/login
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account and select your repository

### 3. Add PostgreSQL Database
1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically set the `DATABASE_URL` environment variable

### 4. Configure Environment Variables
In Railway dashboard, go to your service → **Variables** tab and add:

| Variable | Value |
|----------|-------|
| `SECRET_KEY` | Generate one: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `.railway.app,localhost,127.0.0.1` |
| `CSRF_TRUSTED_ORIGINS` | `https://your-app-name.railway.app` (update after deployment) |

### 5. Deploy
Railway will automatically deploy when you push to GitHub. You can also click **"Deploy"** manually.

### 6. Get Your URL
After deployment, click on your service to find your app URL (e.g., `https://your-app-name.railway.app`)

### 7. Update CSRF Origins
Update `CSRF_TRUSTED_ORIGINS` with your actual Railway URL.

### 8. Create Superuser (Optional)
In Railway, go to your service → **Settings** → **Run Command**:
```bash
python manage.py createsuperuser
```
Or use Railway's shell feature.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | ✅ Yes | Django secret key for security |
| `DEBUG` | ✅ Yes | Set to `False` in production |
| `DATABASE_URL` | Auto | Automatically set by Railway PostgreSQL |
| `ALLOWED_HOSTS` | ✅ Yes | Comma-separated list of allowed hosts |
| `CSRF_TRUSTED_ORIGINS` | ✅ Yes | Full URLs with https:// |

---

## Files Added for Railway

- **requirements.txt** - Python dependencies
- **Procfile** - Process configuration
- **runtime.txt** - Python version specification
- **railway.json** - Railway-specific configuration
- **.env.example** - Example environment variables

---

## Troubleshooting

### Static files not loading
Make sure `collectstatic` runs on deploy (it's in Procfile).

### Database connection error
Verify PostgreSQL is added and `DATABASE_URL` is set.

### CSRF verification failed
Update `CSRF_TRUSTED_ORIGINS` with your exact Railway URL including `https://`.

### 500 errors
Check logs in Railway dashboard. Enable `DEBUG=True` temporarily to see detailed errors.

---

## Local Development

For local development, create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Then set `DEBUG=True` and the app will use SQLite locally.

---

## Important Notes

⚠️ **Media Files**: Railway's filesystem is ephemeral. User uploads will be lost on redeploy. For production, consider using:
- [Cloudinary](https://cloudinary.com) 
- [AWS S3](https://aws.amazon.com/s3/)
- [Railway Volumes](https://docs.railway.app/reference/volumes)

⚠️ **Database**: Always use PostgreSQL in production, never SQLite.

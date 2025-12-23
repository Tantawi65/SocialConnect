# Social Connect - Start Script
# This script starts both backend and frontend servers

Write-Host "Starting Social Connect..." -ForegroundColor Green

# Check if backend is set up
if (-not (Test-Path "backend\db.sqlite3")) {
    Write-Host "`n⚠ Backend database not found. Running setup..." -ForegroundColor Yellow
    cd backend
    
    # Check if venv exists
    if (-not (Test-Path "venv")) {
        Write-Host "Creating virtual environment..." -ForegroundColor Yellow
        python -m venv venv
    }
    
    # Activate venv
    .\venv\Scripts\Activate.ps1
    
    # Install dependencies
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
    
    # Run setup
    .\setup.ps1
    
    Write-Host "`nPlease create a superuser account:" -ForegroundColor Cyan
    python manage.py createsuperuser
    
    cd ..
}

# Start backend in new window
Write-Host "`nStarting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate.ps1; python manage.py runserver"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend in new window
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd front-end; python -m http.server 8080"

# Wait for servers to start
Start-Sleep -Seconds 2

Write-Host "`n✓ Social Connect is running!" -ForegroundColor Green
Write-Host "`nBackend API: http://localhost:8000/api/" -ForegroundColor Cyan
Write-Host "Admin Panel: http://localhost:8000/admin/" -ForegroundColor Cyan
Write-Host "Frontend:    http://localhost:8080/login.html" -ForegroundColor Cyan

Write-Host "`nPress any key to open the application in your browser..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open browser
Start-Process "http://localhost:8080/login.html"

Write-Host "`nServers are running in separate windows." -ForegroundColor Green
Write-Host "Close those windows to stop the servers." -ForegroundColor Yellow

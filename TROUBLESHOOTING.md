# Troubleshooting Guide

## Issue: "It's not loading"

### Quick Diagnosis

Run these commands to check what's missing:

```bash
cd /Users/advikg2023/Downloads/backend-notesync

# Check if pnpm is installed
pnpm --version

# Check if Node.js is installed
node --version

# Check if Docker is installed
docker --version
```

## Solution 1: Install pnpm (Recommended)

### On macOS:

```bash
# Install pnpm globally
npm install -g pnpm

# Or using Homebrew
brew install pnpm

# Verify installation
pnpm --version
```

### On Linux:

```bash
# Using npm
npm install -g pnpm

# Or using curl
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Verify installation
pnpm --version
```

### After installing pnpm:

```bash
cd /Users/advikg2023/Downloads/backend-notesync

# Install all dependencies (will take 2-3 minutes)
pnpm install

# Set up the database
cd apps/api
cp env.example .env
# Edit .env with your database credentials

# Run migrations
pnpm prisma migrate dev

# Start the backend (Terminal 1)
pnpm dev

# In another terminal, start the frontend (Terminal 2)
cd /Users/advikg2023/Downloads/backend-notesync/apps/web
pnpm dev
```

Then visit http://localhost:5173

## Solution 2: Use npm instead of pnpm

If you prefer to use npm (which comes with Node.js):

```bash
cd /Users/advikg2023/Downloads/backend-notesync

# Install dependencies with npm
npm install

# Backend
cd apps/api
cp env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev

# Frontend (in another terminal)
cd /Users/advikg2023/Downloads/backend-notesync/apps/web
npm run dev
```

## Solution 3: Use Docker (Easiest - No pnpm needed!)

If you have Docker installed:

```bash
cd /Users/advikg2023/Downloads/backend-notesync

# Start everything with one command
docker-compose up

# Wait for containers to start (first time takes 3-5 minutes)
# Then visit http://localhost:5173
```

This will:
- Start PostgreSQL database
- Start the API server
- Start the frontend
- Install all dependencies automatically

### To stop Docker:
```bash
docker-compose down
```

### To rebuild after changes:
```bash
docker-compose up --build
```

## Common Issues

### 1. "pnpm: command not found"

**Problem**: pnpm is not installed.

**Solution**: Install pnpm (see Solution 1 above) or use Docker (Solution 3).

### 2. "Port 3000 already in use"

**Problem**: Another application is using port 3000.

**Solutions**:
```bash
# Find what's using the port
lsof -ti:3000

# Kill the process
lsof -ti:3000 | xargs kill -9

# Or change the port in apps/api/.env
PORT=3001
```

### 3. "Port 5173 already in use"

**Problem**: Another Vite server is running.

**Solutions**:
```bash
# Kill the process
lsof -ti:5173 | xargs kill -9

# Or the frontend will suggest another port automatically
```

### 4. "Cannot connect to database"

**Problem**: PostgreSQL is not running or DATABASE_URL is incorrect.

**Solutions**:

**Option A - Use Docker for just PostgreSQL:**
```bash
docker run --name dtc-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=textbook_compiler \
  -p 5432:5432 \
  -d postgres:14-alpine
```

**Option B - Install PostgreSQL locally:**
```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb textbook_compiler
```

**Option C - Use Docker Compose for everything:**
```bash
docker-compose up
```

### 5. "Prisma Client not generated"

**Problem**: Prisma client needs to be generated.

**Solution**:
```bash
cd /Users/advikg2023/Downloads/backend-notesync/apps/api
pnpm prisma generate
# or
npm run prisma:generate
```

### 6. "Module not found" errors

**Problem**: Dependencies not installed.

**Solution**:
```bash
cd /Users/advikg2023/Downloads/backend-notesync

# Clean install
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules

# Reinstall
pnpm install
# or
npm install
```

### 7. Frontend shows blank page

**Possible causes**:
1. Backend API is not running
2. CORS issues
3. Build errors

**Solutions**:
```bash
# Check if API is running
curl http://localhost:3000/health
# Should return: {"status":"ok"}

# Check browser console for errors
# Open browser DevTools (F12) and check Console tab

# Rebuild frontend
cd /Users/advikg2023/Downloads/backend-notesync/apps/web
rm -rf node_modules dist
pnpm install
pnpm dev
```

### 8. Docker "Cannot connect to Docker daemon"

**Problem**: Docker is not running.

**Solution**:
- Start Docker Desktop application
- Wait for it to fully start (whale icon in menu bar)
- Then run `docker-compose up`

## Verification Steps

After setup, verify everything is working:

### 1. Check API Health
```bash
curl http://localhost:3000/health
```
Should return:
```json
{"status":"ok","timestamp":"2024-..."}
```

### 2. Check Frontend
Open browser to http://localhost:5173
- Should see a login page
- No errors in browser console

### 3. Check Database
```bash
cd /Users/advikg2023/Downloads/backend-notesync/apps/api
pnpm prisma studio
```
Opens http://localhost:5555 with database GUI

### 4. Test Registration
1. Go to http://localhost:5173
2. Click "Sign up"
3. Fill form and submit
4. Should redirect to home page

## Still Not Working?

### Check Prerequisites

1. **Node.js version**:
```bash
node --version
# Should be v18 or higher
```

2. **Check all ports are free**:
```bash
lsof -i :3000  # API
lsof -i :5173  # Frontend
lsof -i :5432  # PostgreSQL
```

3. **Check logs**:
```bash
# Backend logs are in the terminal where you ran the dev command
# Frontend logs are in browser console (F12)

# Docker logs
docker-compose logs -f
```

### Get More Help

1. Check the error message carefully
2. Search the error in the documentation
3. Check if ports are available
4. Verify all prerequisites are installed
5. Try the Docker approach (easiest)

## Quick Start Commands (Copy-Paste Ready)

### If you have pnpm:
```bash
cd /Users/advikg2023/Downloads/backend-notesync
pnpm install
cd apps/api
cp env.example .env
pnpm prisma migrate dev
pnpm dev
```

### If you have Docker:
```bash
cd /Users/advikg2023/Downloads/backend-notesync
docker-compose up
```

### If you have npm (but not pnpm):
```bash
cd /Users/advikg2023/Downloads/backend-notesync
npm install
cd apps/api
cp env.example .env
npx prisma migrate dev
npm run dev
```

## Environment Check Script

Run this to check your environment:

```bash
#!/bin/bash
echo "Checking prerequisites..."
echo ""

echo "Node.js: $(node --version 2>&1 || echo 'NOT INSTALLED')"
echo "npm: $(npm --version 2>&1 || echo 'NOT INSTALLED')"
echo "pnpm: $(pnpm --version 2>&1 || echo 'NOT INSTALLED')"
echo "Docker: $(docker --version 2>&1 || echo 'NOT INSTALLED')"
echo "PostgreSQL: $(psql --version 2>&1 || echo 'NOT INSTALLED')"
echo ""

echo "Port availability:"
echo "Port 3000: $(lsof -ti:3000 && echo 'IN USE' || echo 'AVAILABLE')"
echo "Port 5173: $(lsof -ti:5173 && echo 'IN USE' || echo 'AVAILABLE')"
echo "Port 5432: $(lsof -ti:5432 && echo 'IN USE' || echo 'AVAILABLE')"
```

Save this as `check-env.sh`, make it executable with `chmod +x check-env.sh`, and run `./check-env.sh`


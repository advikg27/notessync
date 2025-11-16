# 🚀 START HERE - Get the Project Running

## Current Status
❌ **Dependencies NOT installed** - This is why the browser isn't loading!

## Follow These Steps EXACTLY

### Step 1: Install pnpm (1 minute)

Open your terminal and run:

```bash
corepack enable
```

That's it! pnpm is now available.

### Step 2: Install Dependencies (2-3 minutes)

```bash
cd /Users/advikg2023/Downloads/backend-notesync
pnpm install
```

Wait for it to finish. You'll see a lot of packages being downloaded.

### Step 3: Set Up Environment Variables

```bash
cd apps/api
cp env.example .env
```

Now edit the `.env` file if needed. Default settings:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/textbook_compiler?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this"
PORT=3000
```

### Step 4: Start PostgreSQL Database

**Option A - Using Docker (Easiest):**
```bash
docker run --name dtc-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=textbook_compiler \
  -p 5432:5432 \
  -d postgres:14-alpine
```

**Option B - If you have PostgreSQL installed locally:**
```bash
createdb textbook_compiler
```

### Step 5: Run Database Migrations

```bash
cd /Users/advikg2023/Downloads/backend-notesync/apps/api
pnpm prisma migrate dev
pnpm prisma generate
```

### Step 6: Start the Backend (Terminal 1)

```bash
cd /Users/advikg2023/Downloads/backend-notesync/apps/api
pnpm dev
```

You should see:
```
🚀 Server running at http://0.0.0.0:3000
```

**Keep this terminal open!**

### Step 7: Start the Frontend (Terminal 2)

Open a **NEW terminal** and run:

```bash
cd /Users/advikg2023/Downloads/backend-notesync/apps/web
pnpm dev
```

You should see:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 8: Open in Browser

Go to: **http://localhost:5173**

You should see the login page! 🎉

## If It Still Doesn't Load...

### Check 1: Is the frontend server running?
```bash
lsof -i :5173
```
If nothing shows up, the frontend isn't running. Go back to Step 7.

### Check 2: Is the backend running?
```bash
curl http://localhost:3000/health
```
Should return: `{"status":"ok",...}`

### Check 3: Look at browser console
1. Open browser DevTools (press F12)
2. Go to Console tab
3. Look for errors in red

### Check 4: Look at terminal logs
- Check Terminal 1 (backend) for errors
- Check Terminal 2 (frontend) for errors

## Common Errors and Fixes

### "corepack: command not found"
Your Node.js version might be too old. Update Node.js or install pnpm manually:
```bash
npm install -g pnpm
```

### "Cannot connect to database"
Make sure PostgreSQL is running:
```bash
# Check if postgres is running
docker ps | grep postgres

# Or if installed locally
pg_isready
```

### "Port 3000 already in use"
Something else is using port 3000:
```bash
lsof -ti:3000 | xargs kill -9
```

### "Port 5173 already in use"
Kill the process:
```bash
lsof -ti:5173 | xargs kill -9
```

### Browser shows "Cannot connect" or "ERR_CONNECTION_REFUSED"
The frontend server isn't running. Check:
1. Did you run `pnpm dev` in the `apps/web` directory?
2. Look at the terminal - are there any errors?
3. Try running `pnpm install` again in the web directory

## Quick Copy-Paste Commands

If you just want to copy-paste all commands at once:

```bash
# 1. Enable pnpm
corepack enable

# 2. Install dependencies
cd /Users/advikg2023/Downloads/backend-notesync
pnpm install

# 3. Setup environment
cd apps/api
cp env.example .env

# 4. Start PostgreSQL (if using Docker)
docker run --name dtc-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=textbook_compiler \
  -p 5432:5432 \
  -d postgres:14-alpine

# 5. Run migrations
pnpm prisma migrate dev
pnpm prisma generate

# 6. Start backend (this terminal)
pnpm dev
```

Then in a **NEW TERMINAL**:
```bash
cd /Users/advikg2023/Downloads/backend-notesync/apps/web
pnpm dev
```

Then open: http://localhost:5173

## Visual Guide

```
┌─────────────────────────────────────────┐
│  Terminal 1: Backend (port 3000)        │
│  $ cd apps/api                          │
│  $ pnpm dev                             │
│  🚀 Server running at http://...:3000   │
│  [Keep this running]                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Terminal 2: Frontend (port 5173)       │
│  $ cd apps/web                          │
│  $ pnpm dev                             │
│  ➜ Local: http://localhost:5173/       │
│  [Keep this running]                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Browser: http://localhost:5173         │
│  [This is where you access the app]     │
└─────────────────────────────────────────┘
```

## Success Checklist

- [ ] pnpm installed (`corepack enable`)
- [ ] Dependencies installed (`pnpm install`)
- [ ] PostgreSQL running
- [ ] Migrations completed
- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] Browser opens http://localhost:5173
- [ ] Login page is visible

## Still Having Issues?

1. Read `TROUBLESHOOTING.md` in this directory
2. Check that you're in the correct directory
3. Make sure both terminals are running
4. Check browser console (F12) for errors
5. Try running `pnpm install` again

## Need Help?

If you're still stuck, tell me:
1. What command are you running?
2. What error message do you see?
3. Which step are you on?


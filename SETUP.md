# Setup Guide - Distributed Textbook Compiler

Complete step-by-step guide to get the project running.

## Prerequisites

Before starting, ensure you have:
- **Node.js** 18 or higher (`node --version`)
- **pnpm** 8 or higher (`pnpm --version`)
- **PostgreSQL** 14 or higher
- **Git**

## Quick Start (Recommended)

### Option 1: Docker (Easiest)

```bash
# Start all services
docker-compose up

# The application will be available at:
# - Frontend: http://localhost:5173
# - API: http://localhost:3000
# - PostgreSQL: localhost:5432
```

That's it! Skip to the "First Steps" section below.

### Option 2: Local Development

Follow these steps for local development without Docker.

## Step-by-Step Local Setup

### 1. Clone and Install

```bash
# Navigate to the project
cd backend-notesync

# Install all dependencies (this will take a few minutes)
pnpm install
```

### 2. Set Up PostgreSQL

**Option A: Using Docker**
```bash
docker run --name dtc-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=textbook_compiler \
  -p 5432:5432 \
  -d postgres:14-alpine
```

**Option B: Using Local PostgreSQL**
```bash
# Create database
createdb textbook_compiler

# Or using psql
psql -U postgres
CREATE DATABASE textbook_compiler;
\q
```

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp apps/api/env.example apps/api/.env

# Edit the file with your settings
nano apps/api/.env
```

**Minimum required configuration**:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/textbook_compiler?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this"
PORT=3000
```

### 4. Set Up the Database

```bash
# Navigate to API directory
cd apps/api

# Run migrations to create tables
pnpm prisma migrate dev

# Generate Prisma client
pnpm prisma generate

# (Optional) Seed the database with sample data
# pnpm prisma db seed

# Return to root
cd ../..
```

### 5. Start Development Servers

**Terminal 1 - Backend API**:
```bash
cd apps/api
pnpm dev
```

You should see:
```
🚀 Server running at http://0.0.0.0:3000
```

**Terminal 2 - Frontend**:
```bash
cd apps/web
pnpm dev
```

You should see:
```
  VITE v5.0.8  ready in X ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 6. Verify Installation

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **API Health**: http://localhost:3000/health

You should see the login page for the frontend and `{"status":"ok"}` for the API.

## First Steps

### 1. Create an Account

1. Go to http://localhost:5173
2. Click "Sign up"
3. Fill in your details:
   - Name: Your Name
   - Email: your@email.com
   - Password: (minimum 6 characters)
4. Click "Sign Up"

### 2. Create a Course

1. After logging in, you'll see the home page
2. For now, create a course manually using the API or Prisma Studio:

**Using Prisma Studio**:
```bash
cd apps/api
pnpm prisma studio
```

Then:
- Open http://localhost:5555
- Navigate to "Course" model
- Click "Add record"
- Fill in: name = "Calculus I", ownerId = (your user ID)
- Save

**Or using curl**:
```bash
# Get your token from localStorage in browser console
# Then:
curl -X POST http://localhost:3000/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Calculus I"}'
```

### 3. Create Your First Module

1. Click "New Module" button
2. Fill in the form:
   - **Title**: "Definition of Derivative"
   - **Type**: Definition
   - **Course**: Select your course
   - **Tags**: calculus, derivatives
   - **Content**:
     ```markdown
     # Derivative
     
     The derivative of a function measures the rate at which the function value changes.
     
     ## Formal Definition
     
     The derivative of $f(x)$ at $x = a$ is defined as:
     
     $$f'(a) = \lim_{h \to 0} \frac{f(a+h) - f(a)}{h}$$
     
     provided this limit exists.
     ```
3. Click "Create"

### 4. Create More Modules

Create a few more modules with cross-references:

**Module 2: Example**
```markdown
# Computing a Derivative

Let's compute the derivative of $f(x) = x^2$.

See @module:MODULE_ID_1 for the formal definition.

Using the limit definition:
$$f'(x) = \lim_{h \to 0} \frac{(x+h)^2 - x^2}{h}$$
```

### 5. Compile a Textbook

1. Go to "Builder" page
2. Select your course
3. Add modules in desired order
4. Click "Compile to PDF"
5. Your textbook will download!

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000 (API)
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173 (Frontend)
lsof -ti:5173 | xargs kill -9
```

### Database Connection Failed

Check your `DATABASE_URL` in `.env`:
```bash
# Test connection
psql postgresql://postgres:password@localhost:5432/textbook_compiler -c "SELECT 1"
```

### Prisma Client Not Generated

```bash
cd apps/api
pnpm prisma generate
```

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
pnpm install
```

### CORS Errors

Make sure the API is configured to allow requests from the frontend:
- Frontend default: http://localhost:5173
- API default: http://localhost:3000

### PDF Generation Fails

Puppeteer might need additional dependencies on Linux:
```bash
# Ubuntu/Debian
sudo apt-get install -y chromium-browser

# Or install Chromium dependencies
sudo apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

## Development Tools

### Prisma Studio (Database GUI)

```bash
cd apps/api
pnpm prisma studio
```

Access at http://localhost:5555

### View Database Migrations

```bash
cd apps/api
pnpm prisma migrate status
```

### Reset Database (Careful!)

```bash
cd apps/api
pnpm prisma migrate reset
```

This will:
1. Drop all tables
2. Re-run all migrations
3. Run seed script (if configured)

### View Logs

Backend logs are shown in the terminal where you ran `pnpm dev`.

To save logs to a file:
```bash
cd apps/api
pnpm dev 2>&1 | tee api.log
```

## Production Deployment

### Build for Production

```bash
# Build all packages
pnpm build

# The built files will be in:
# - apps/api/dist/
# - apps/web/dist/
```

### Environment Variables for Production

Create `apps/api/.env.production`:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="strong-random-secret-key-here"
PORT=3000
NODE_ENV=production
CORS_ORIGIN="https://yourdomain.com"
```

### Run Production Build

```bash
# API
cd apps/api
NODE_ENV=production node dist/index.js

# Web (serve static files with nginx/caddy/etc)
# Or use a service like Vercel, Netlify
```

## Useful Commands Reference

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev                    # All services
cd apps/api && pnpm dev    # API only
cd apps/web && pnpm dev    # Web only

# Build
pnpm build                  # All packages

# Database
cd apps/api
pnpm prisma migrate dev     # Create and apply migration
pnpm prisma generate        # Generate Prisma client
pnpm prisma studio          # Open database GUI
pnpm prisma migrate reset   # Reset database

# Docker
docker-compose up           # Start all services
docker-compose down         # Stop all services
docker-compose logs -f      # View logs
```

## Next Steps

1. Read the [Architecture Documentation](docs/architecture.md)
2. Check the [API Specification](docs/api-spec.md)
3. Review the [Contributing Guide](docs/contributing.md)
4. Explore the [Database Schema](docs/db-schema.md)

## Getting Help

- Check existing issues on GitHub
- Read the documentation in `/docs`
- Review the troubleshooting section above

## Success! 🎉

You should now have a fully functional Distributed Textbook Compiler running locally. Happy compiling!


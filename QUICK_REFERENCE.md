# Quick Reference Card

Fast lookup for common tasks and commands.

## 🚀 Getting Started

```bash
# Clone and setup
cd backend-notesync
pnpm install

# Start with Docker (easiest)
docker-compose up

# Or start manually
cd apps/api && pnpm dev     # Terminal 1
cd apps/web && pnpm dev     # Terminal 2

# URLs
Frontend: http://localhost:5173
API:      http://localhost:3000
DB GUI:   http://localhost:5555 (pnpm prisma studio)
```

## 📦 Common Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev                    # All services
cd apps/api && pnpm dev     # API only
cd apps/web && pnpm dev     # Web only

# Build
pnpm build                  # All packages
cd apps/api && pnpm build   # API only
cd apps/web && pnpm build   # Web only

# Clean
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

## 🗄️ Database Commands

```bash
cd apps/api

# Migrations
pnpm prisma migrate dev              # Create and apply
pnpm prisma migrate dev --name xyz   # Create with name
pnpm prisma migrate deploy           # Production
pnpm prisma migrate reset            # Reset (careful!)

# Client
pnpm prisma generate                 # Generate client
pnpm prisma studio                   # Open GUI

# Inspect
pnpm prisma migrate status
pnpm prisma db pull                  # Pull from DB
pnpm prisma db push                  # Push to DB
```

## 🐳 Docker Commands

```bash
# Start
docker-compose up              # Foreground
docker-compose up -d           # Background

# Stop
docker-compose down            # Stop services
docker-compose down -v         # Stop + remove volumes

# Logs
docker-compose logs            # All logs
docker-compose logs -f api     # Follow API logs

# Rebuild
docker-compose build           # Rebuild images
docker-compose up --build      # Rebuild and start
```

## 🔑 Environment Variables

```env
# apps/api/.env
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="your-secret-key"
PORT=3000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```

## 📡 API Endpoints

### Auth
```bash
POST   /auth/register          # Register
POST   /auth/login             # Login
GET    /auth/me                # Current user
```

### Modules
```bash
POST   /modules/               # Create
GET    /modules/               # List
GET    /modules/:id            # Get one
PUT    /modules/:id            # Update
DELETE /modules/:id            # Delete
GET    /modules/:id/versions   # Versions
POST   /modules/:id/restore    # Restore
```

### Courses
```bash
POST   /courses/               # Create
GET    /courses/               # List
GET    /courses/:id            # Get one
GET    /courses/:id/modules    # Course modules
POST   /courses/:id/enroll     # Enroll
```

### Compiler
```bash
POST   /compiler/compile                 # Compile
GET    /compiler/dependency-graph/:id    # Graph
```

## 🧪 Testing API with curl

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Use token in subsequent requests
TOKEN="your-jwt-token-here"

# Create course
curl -X POST http://localhost:3000/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"My Course"}'

# Create module
curl -X POST http://localhost:3000/modules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "courseId":"course-id",
    "type":"definition",
    "title":"Test Module",
    "contentMarkdown":"# Hello World",
    "tags":["test"]
  }'
```

## 📝 Module Types

- `definition` - Formal definitions
- `example` - Worked examples
- `explanation` - Conceptual explanations
- `diagram` - Visual representations
- `proof` - Mathematical proofs
- `problem` - Practice problems

## 🔗 Cross-Module References

```markdown
# In your markdown content:
See @module:MODULE_ID for more details.

# Compiles to:
See <a href="#module-MODULE_ID">Module Title</a> for more details.
```

## 🎨 UI Components (packages/ui)

```tsx
import { Button, Card, Badge, Spinner } from '@dtc/ui';

<Button variant="primary" size="md">Click Me</Button>
<Card><Card.Title>Title</Card.Title></Card>
<Badge variant="success">Active</Badge>
<Spinner size="md" />
```

## 🛠️ Utility Functions (packages/utils)

```typescript
import {
  formatRelativeTime,
  truncate,
  debounce,
  sleep,
  generateId,
  isValidEmail,
  capitalize,
  slugify
} from '@dtc/utils';

formatRelativeTime(new Date());  // "2h ago"
truncate("Long text", 10);       // "Long te..."
debounce(fn, 300);               // Debounced function
```

## 🧩 Markdown Engine (packages/markdown-engine)

```typescript
import {
  parseReferences,
  convertMarkdownToHtml,
  resolveReferences,
  detectCycles,
  generateTOC,
  addHeadingIds
} from '@dtc/markdown-engine';

const refs = parseReferences(markdown);
const html = await convertMarkdownToHtml(markdown);
const resolved = resolveReferences(html, moduleMap);
```

## 🗂️ Project Structure

```
apps/
  api/          ← Backend (Fastify)
    src/
      routes/   ← API endpoints
      modules/  ← Business logic
  web/          ← Frontend (React)
    src/
      pages/    ← Route pages
      components/ ← UI components
packages/
  markdown-engine/  ← Parsing
  ui/              ← Components
  utils/           ← Helpers
```

## 🐛 Troubleshooting

```bash
# Port in use
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Database issues
cd apps/api
pnpm prisma migrate reset
pnpm prisma generate

# Module errors
rm -rf node_modules
pnpm install

# Docker issues
docker-compose down -v
docker-compose up --build

# View logs
docker-compose logs -f
```

## 📊 Database Models

```
User
├── Module (author)
├── Course (owner)
└── CourseMembership

Course
├── Module
└── CourseMembership

Module
├── ModuleVersion (history)
├── ModuleTag
└── ModuleReference (both directions)
```

## 🎯 Common Patterns

### Creating a Module with References

```typescript
const module = await prisma.module.create({
  data: {
    title: 'Example',
    type: 'definition',
    courseId: 'course-id',
    authorId: 'user-id',
    versions: {
      create: {
        versionNumber: 1,
        contentMarkdown: '# Content',
      },
    },
    tags: {
      create: [{ tag: 'math' }],
    },
  },
});
```

### Fetching Module with Relations

```typescript
const module = await prisma.module.findUnique({
  where: { id },
  include: {
    versions: true,
    tags: true,
    author: true,
    outgoingRefs: {
      include: { referencedModule: true },
    },
  },
});
```

## 🔐 Authentication Flow

```
1. User submits credentials
2. Backend verifies with bcrypt
3. Generate JWT token
4. Return token to client
5. Client stores in localStorage
6. Include in Authorization header
7. Backend verifies on protected routes
```

## ⚡ Performance Tips

1. Use `select` to fetch only needed fields
2. Add indexes for frequently queried fields
3. Use React Query for caching
4. Debounce user inputs
5. Lazy load routes
6. Use connection pooling

## 📚 Resources

- [Fastify Docs](https://www.fastify.io/)
- [Prisma Docs](https://www.prisma.io/docs)
- [React Docs](https://react.dev/)
- [TailwindCSS Docs](https://tailwindcss.com/)
- [Zustand Docs](https://github.com/pmndrs/zustand)

## 🆘 Getting Help

1. Check `docs/` folder
2. Read `SETUP.md`
3. Check troubleshooting section
4. Review console errors
5. Check database with Prisma Studio

---

**Quick Links**:
- [Full README](README.md)
- [Setup Guide](SETUP.md)
- [Architecture](docs/architecture.md)
- [API Spec](docs/api-spec.md)
- [Contributing](docs/contributing.md)


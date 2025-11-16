# Architecture Documentation

## System Overview

The Distributed Textbook Compiler is built as a monorepo using pnpm workspaces. It consists of:

1. **Frontend** (React + Vite)
2. **Backend API** (Fastify + TypeScript)
3. **Database** (PostgreSQL + Prisma ORM)
4. **Shared Packages** (markdown-engine, ui, utils)

## Architecture Diagram

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────┐
│  API Server │
│  (Fastify)  │
└──────┬──────┘
       │
       ├──────► PostgreSQL (Data)
       │
       └──────► Compiler (HTML/PDF)
                   │
                   └──► Markdown Engine
                           │
                           └──► Puppeteer (PDF)
```

## Layer Responsibilities

### 1. Frontend Layer

**Technology**: React 18, Vite, TailwindCSS

**Responsibilities**:
- User interface rendering
- State management (Zustand)
- API communication
- Draft management (localStorage)
- Client-side routing

**Key Components**:
- `Layout`: Main application shell
- `EditorPage`: Module creation/editing
- `ModuleListPage`: Browse and search modules
- `BuilderPage`: Textbook compilation interface
- `LoginPage`/`RegisterPage`: Authentication

### 2. API Layer

**Technology**: Fastify, TypeScript, JWT

**Responsibilities**:
- Request handling and validation
- Business logic
- Authentication and authorization
- Database operations
- Compilation orchestration

**Key Routes**:
- `/auth/*`: Authentication endpoints
- `/modules/*`: Module CRUD operations
- `/courses/*`: Course management
- `/compiler/*`: Compilation endpoints

### 3. Database Layer

**Technology**: PostgreSQL, Prisma ORM

**Schema**:
- `User`: User accounts
- `Course`: Course containers
- `Module`: Content modules
- `ModuleVersion`: Version history
- `ModuleTag`: Module tags
- `ModuleReference`: Module dependencies
- `CourseMembership`: User-course relationships

### 4. Compiler Layer

**Technology**: marked, Puppeteer

**Responsibilities**:
- Markdown to HTML conversion
- Reference resolution
- Dependency graph analysis
- TOC generation
- PDF generation

**Process**:
1. Fetch modules and versions
2. Check for cyclic dependencies
3. Convert markdown to HTML
4. Resolve cross-module references
5. Generate table of contents
6. Wrap in template
7. Convert to PDF (if requested)

## Data Flow

### Module Creation Flow

```
User Input → Draft Store (localStorage) → API Request → Validation → 
Database Write → Version Creation → Reference Parsing → Success Response
```

### Compilation Flow

```
Module Selection → Order Definition → API Request → Module Fetch → 
Dependency Check → Markdown Conversion → Reference Resolution → 
TOC Generation → Template Wrap → PDF/HTML Generation → Download
```

## Security

### Authentication
- JWT-based authentication
- Bcrypt password hashing (10 rounds)
- Token stored in localStorage
- Automatic token injection in API requests

### Authorization
- Course membership required for module access
- Only module authors can delete modules
- Only course owners can delete courses

## Performance Considerations

### Frontend
- React Query for caching and request deduplication
- Lazy loading of routes
- Debounced draft saving (1 second)

### Backend
- Connection pooling (Prisma)
- Indexed database queries
- Streaming for large PDF downloads

### Database
- Indexed foreign keys
- Efficient query patterns
- Cascade deletes for cleanup

## Scalability

### Current Architecture
- Monolithic API server
- Single database instance
- Synchronous compilation

### Future Improvements
- Microservices for compiler
- Queue-based compilation (Bull/Redis)
- CDN for compiled textbooks
- Read replicas for database
- Horizontal scaling with load balancer

## Development Workflow

1. **Local Development**:
   - Run PostgreSQL locally or via Docker
   - Start API server (`pnpm dev` in `apps/api`)
   - Start frontend (`pnpm dev` in `apps/web`)

2. **Docker Development**:
   - `docker-compose up`
   - All services start together
   - Hot reload enabled

3. **Testing**:
   - Unit tests with Vitest
   - Integration tests with Supertest
   - E2E tests with Playwright (future)

## Deployment

### Production Checklist
- [ ] Set strong JWT_SECRET
- [ ] Use production database
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Configure logging
- [ ] Set up backups
- [ ] Rate limiting
- [ ] CORS configuration

### Deployment Options
1. **Single Server** (small scale)
2. **Container Orchestration** (Kubernetes)
3. **Serverless Functions** (API only)
4. **Platform as a Service** (Heroku, Railway)

## Monitoring and Logging

### Logs
- Fastify built-in logger
- Log levels: error, warn, info, debug
- Structured logging for production

### Metrics (Future)
- Request latency
- Compilation time
- Database query performance
- Error rates

## Backup and Recovery

### Database
- Daily automated backups
- Point-in-time recovery
- Backup retention: 30 days

### Version Control
- Git for code
- Migrations tracked in Git
- Database schema versioned

## Technology Choices Rationale

| Technology | Reason |
|------------|--------|
| React | Rich ecosystem, component reusability |
| Fastify | Performance, TypeScript support |
| PostgreSQL | ACID compliance, relational data |
| Prisma | Type safety, migrations, DX |
| pnpm | Fast, disk-efficient, monorepo support |
| Puppeteer | Reliable PDF generation |
| TailwindCSS | Rapid UI development |
| Zustand | Lightweight state management |

## Future Architecture Considerations

1. **Real-time Collaboration**: WebSocket support
2. **Search**: Elasticsearch integration
3. **Caching**: Redis for session and query cache
4. **File Storage**: S3 for compiled textbooks
5. **Email**: SendGrid for notifications


# Distributed Textbook Compiler

A collaborative learning system where students create modular academic content blocks and compile them into full textbooks, study guides, or class packets.

## Features

- **Modular Content Creation**: Create self-contained chunks of content (definitions, examples, explanations, diagrams, proofs)
- **Cross-Module References**: Reference other modules using `@module:ID` syntax
- **Version Control**: Full version history for every module
- **Compilation**: Generate HTML and PDF textbooks from selected modules
- **Course Management**: Organize modules by course
- **Offline Draft Support**: LocalStorage-based draft system

## Architecture

- **Frontend**: React + Vite + TypeScript
- **Backend**: Fastify + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Monorepo**: pnpm workspaces

## Project Structure

```
distributed-textbook-compiler/
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Fastify backend
├── packages/
│   ├── markdown-engine/  # Markdown parsing & HTML conversion
│   ├── ui/          # Shared React components
│   └── utils/       # Shared utilities
├── infra/
│   ├── docker/      # Docker configurations
│   └── scripts/     # Development scripts
└── docs/            # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+
- Docker (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend-notesync
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp apps/api/.env.example apps/api/.env
```

4. Set up the database:
```bash
cd apps/api
pnpm prisma migrate dev
pnpm prisma generate
```

5. Start development servers:
```bash
# Terminal 1 - API
cd apps/api
pnpm dev

# Terminal 2 - Web
cd apps/web
pnpm dev
```

### Using Docker

```bash
docker-compose up
```

## API Endpoints

### Authentication
- `POST /auth/register` - Create user
- `POST /auth/login` - Login and get JWT

### Modules
- `POST /modules/` - Create module
- `GET /modules/` - List modules
- `GET /modules/:id` - Get module
- `PUT /modules/:id` - Update module
- `GET /modules/:id/versions` - List versions
- `POST /modules/:id/restore` - Restore version

### Courses
- `POST /courses/` - Create course
- `GET /courses/:id/modules` - Get course modules
- `POST /courses/:id/enroll` - Enroll user

### Compiler
- `POST /compiler/compile` - Compile modules to HTML/PDF

## Development

### Workspace Commands

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
```

### Database

```bash
# Create migration
cd apps/api
pnpm prisma migrate dev --name <migration-name>

# Reset database
pnpm prisma migrate reset

# Open Prisma Studio
pnpm prisma studio
```

## Module System

### Module Types
- Definition
- Example
- Explanation
- Diagram
- Proof
- Problem

### Cross-Module References

Use `@module:ID` syntax to reference other modules:

```markdown
See @module:def123 for the definition of a derivative.

The proof is shown in @module:proof456.
```

When compiled, these become clickable links to the referenced modules.

## Contributing

See [CONTRIBUTING.md](docs/contributing.md) for development guidelines.

## License

MIT


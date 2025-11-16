# Contributing Guide

Thank you for your interest in contributing to the Distributed Textbook Compiler!

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL 14+
- Git

### Setup Development Environment

1. **Clone the repository**:
```bash
git clone <repository-url>
cd backend-notesync
```

2. **Install dependencies**:
```bash
pnpm install
```

3. **Set up environment variables**:
```bash
cp apps/api/env.example apps/api/.env
# Edit .env with your database credentials
```

4. **Set up the database**:
```bash
cd apps/api
pnpm prisma migrate dev
pnpm prisma generate
```

5. **Start development servers**:
```bash
# Terminal 1 - API
cd apps/api
pnpm dev

# Terminal 2 - Web
cd apps/web
pnpm dev
```

### Using Docker (Alternative)

```bash
docker-compose up
```

## Project Structure

```
distributed-textbook-compiler/
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Fastify backend
├── packages/
│   ├── markdown-engine/
│   ├── ui/
│   └── utils/
├── infra/
│   ├── docker/
│   └── scripts/
└── docs/
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/changes

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run tests
pnpm test

# Run linter
pnpm lint
```

### 4. Commit Changes

Use conventional commit messages:

```bash
git commit -m "feat: add module search functionality"
git commit -m "fix: resolve reference resolution bug"
git commit -m "docs: update API documentation"
```

Commit types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Create a pull request with:
- Clear title and description
- Link to related issues
- Screenshots (for UI changes)
- Test coverage information

## Code Style

### TypeScript

- Use TypeScript for all new code
- Prefer `interface` over `type` for objects
- Use explicit return types for functions
- Avoid `any` type when possible

```typescript
// Good
interface User {
  id: string;
  name: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// Avoid
function getUser(id: any): any {
  // ...
}
```

### React

- Use functional components
- Use hooks for state management
- Extract complex logic to custom hooks
- Keep components small and focused

```tsx
// Good
export function ModuleCard({ module }: { module: Module }) {
  const { deleteModule } = useModules();
  
  return (
    <div className="module-card">
      <h3>{module.title}</h3>
      <button onClick={() => deleteModule(module.id)}>
        Delete
      </button>
    </div>
  );
}
```

### CSS (TailwindCSS)

- Use Tailwind utility classes
- Extract common patterns to components
- Use responsive utilities
- Maintain consistent spacing

```tsx
// Good
<div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow">
  {/* ... */}
</div>
```

## Testing Guidelines

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { parseReferences } from './markdown';

describe('parseReferences', () => {
  it('should extract module references', () => {
    const markdown = 'See @module:abc123 for details';
    const refs = parseReferences(markdown);
    expect(refs).toEqual(['abc123']);
  });
});
```

### Integration Tests

```typescript
import { test } from 'vitest';
import { app } from '../index';

test('POST /modules should create module', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/modules',
    headers: {
      authorization: `Bearer ${token}`,
    },
    payload: {
      title: 'Test Module',
      type: 'definition',
      courseId: 'test-course',
      contentMarkdown: '# Test',
    },
  });

  expect(response.statusCode).toBe(201);
});
```

## Database Changes

### Creating Migrations

```bash
cd apps/api
pnpm prisma migrate dev --name add_user_avatar
```

### Migration Guidelines

- Create descriptive migration names
- Test migrations up and down
- Never edit existing migrations
- Include data migrations if needed

## API Changes

### Adding New Endpoints

1. Create route file in `apps/api/src/routes/`
2. Implement handler with proper validation
3. Add authentication if needed
4. Update API documentation
5. Write tests

Example:

```typescript
// apps/api/src/routes/tags.ts
import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const createTagSchema = z.object({
  name: z.string().min(1),
});

export async function tagRoutes(fastify: FastifyInstance) {
  fastify.post('/tags', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const body = createTagSchema.parse(request.body);
    // Implementation...
  });
}
```

## Frontend Changes

### Adding New Components

```tsx
// apps/web/src/components/ModuleCard.tsx
interface ModuleCardProps {
  module: Module;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ModuleCard({ module, onEdit, onDelete }: ModuleCardProps) {
  return (
    <div className="border rounded-lg p-4">
      {/* Implementation */}
    </div>
  );
}
```

### Adding New Pages

1. Create page component in `apps/web/src/pages/`
2. Add route in `App.tsx`
3. Update navigation if needed

## Documentation

### When to Update Documentation

- Adding new features
- Changing API endpoints
- Modifying database schema
- Adding configuration options
- Fixing bugs (if relevant)

### Documentation Files

- `README.md` - Getting started
- `docs/architecture.md` - System design
- `docs/api-spec.md` - API reference
- `docs/contributing.md` - This file

## Common Issues

### Database Connection Error

```bash
# Reset database
cd apps/api
pnpm prisma migrate reset
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules
pnpm install
```

### Prisma Client Out of Sync

```bash
cd apps/api
pnpm prisma generate
```

## Getting Help

- Check existing issues on GitHub
- Read the documentation
- Ask in discussions
- Contact maintainers

## Code Review Process

### For Reviewers

- Be constructive and respectful
- Test the changes locally
- Check for edge cases
- Verify documentation is updated
- Ensure tests pass

### For Contributors

- Respond to feedback promptly
- Make requested changes
- Ask questions if unclear
- Update PR description as needed

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag
4. Push tag to trigger CI/CD
5. Create GitHub release

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Thank You!

Your contributions help make this project better for everyone!


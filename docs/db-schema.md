# Database Schema Documentation

## Overview

The database uses PostgreSQL with Prisma ORM. All IDs use `cuid` for global uniqueness.

## Entity Relationship Diagram

```
User ───< Module
 │         │
 │         ├──< ModuleVersion
 │         ├──< ModuleTag
 │         └──< ModuleReference
 │
 ├──< Course
 │     │
 │     └──< Module
 │
 └──< CourseMembership >─── Course
```

## Tables

### User

Stores user account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, cuid | Unique identifier |
| name | String | NOT NULL | User's full name |
| email | String | UNIQUE, NOT NULL | Email address |
| passwordHash | String | NOT NULL | Bcrypt hashed password |
| createdAt | DateTime | DEFAULT now() | Account creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `email`

**Relations**:
- Has many `Module` (as author)
- Has many `Course` (as owner)
- Has many `CourseMembership`

### Course

Represents a course or class.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, cuid | Unique identifier |
| name | String | NOT NULL | Course name |
| ownerId | String | FK → User.id | Course owner |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |

**Indexes**:
- Primary key on `id`
- Foreign key index on `ownerId`

**Relations**:
- Belongs to `User` (owner)
- Has many `Module`
- Has many `CourseMembership`

### CourseMembership

Links users to courses (enrollment).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, cuid | Unique identifier |
| userId | String | FK → User.id | Enrolled user |
| courseId | String | FK → Course.id | Course |
| createdAt | DateTime | DEFAULT now() | Enrollment timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `(userId, courseId)`
- Foreign key indexes on `userId` and `courseId`

**Relations**:
- Belongs to `User`
- Belongs to `Course`

### Module

Represents a content module.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, cuid | Unique identifier |
| courseId | String | FK → Course.id | Parent course |
| authorId | String | FK → User.id | Module author |
| type | String | NOT NULL | Module type (see below) |
| title | String | NOT NULL | Module title |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |

**Module Types**:
- `definition`
- `example`
- `explanation`
- `diagram`
- `proof`
- `problem`

**Indexes**:
- Primary key on `id`
- Foreign key indexes on `courseId` and `authorId`
- Index on `type`
- Index on `updatedAt` (for sorting)

**Relations**:
- Belongs to `Course`
- Belongs to `User` (author)
- Has many `ModuleVersion`
- Has many `ModuleTag`
- Has many `ModuleReference` (as source)
- Has many `ModuleReference` (as target)

### ModuleVersion

Stores version history for modules.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, cuid | Unique identifier |
| moduleId | String | FK → Module.id | Parent module |
| versionNumber | Int | NOT NULL | Version number (1, 2, 3...) |
| contentMarkdown | String | TEXT, NOT NULL | Raw markdown content |
| contentHtml | String | TEXT, NULLABLE | Rendered HTML |
| createdAt | DateTime | DEFAULT now() | Version creation timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `(moduleId, versionNumber)`
- Foreign key index on `moduleId`

**Relations**:
- Belongs to `Module`
- Cascade delete when module is deleted

**Notes**:
- Version numbers increment sequentially (1, 2, 3...)
- Each edit creates a new version
- Old versions are never modified

### ModuleTag

Tags for categorizing modules.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, cuid | Unique identifier |
| moduleId | String | FK → Module.id | Parent module |
| tag | String | NOT NULL | Tag name |

**Indexes**:
- Primary key on `id`
- Unique index on `(moduleId, tag)`
- Foreign key index on `moduleId`
- Index on `tag` (for filtering)

**Relations**:
- Belongs to `Module`
- Cascade delete when module is deleted

### ModuleReference

Tracks cross-module references.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, cuid | Unique identifier |
| sourceModuleId | String | FK → Module.id | Source module |
| referencedModuleId | String | FK → Module.id | Referenced module |

**Indexes**:
- Primary key on `id`
- Unique index on `(sourceModuleId, referencedModuleId)`
- Foreign key indexes on both module IDs

**Relations**:
- Belongs to `Module` (as source)
- Belongs to `Module` (as referenced)
- Cascade delete when either module is deleted

**Notes**:
- Automatically created when parsing `@module:ID` syntax
- Used for dependency graph analysis
- Checked for cycles before compilation

## Queries and Performance

### Common Query Patterns

#### Get User's Modules
```sql
SELECT m.* FROM modules m
JOIN courses c ON m.course_id = c.id
JOIN course_memberships cm ON c.id = cm.course_id
WHERE cm.user_id = ?
ORDER BY m.updated_at DESC;
```

#### Get Module with Latest Version
```sql
SELECT m.*, mv.* FROM modules m
JOIN module_versions mv ON m.id = mv.module_id
WHERE m.id = ?
AND mv.version_number = (
  SELECT MAX(version_number)
  FROM module_versions
  WHERE module_id = m.id
);
```

#### Search Modules
```sql
SELECT m.* FROM modules m
WHERE m.title ILIKE ?
AND m.type = ?
AND EXISTS (
  SELECT 1 FROM module_tags mt
  WHERE mt.module_id = m.id
  AND mt.tag = ?
)
ORDER BY m.updated_at DESC;
```

### Optimization Strategies

1. **Indexes**: All foreign keys are indexed automatically by Prisma
2. **Selective Loading**: Use Prisma's `select` and `include` to fetch only needed fields
3. **Pagination**: Add limit/offset for large result sets (future)
4. **Caching**: Cache frequently accessed modules (future)

## Migrations

### Creating a Migration

```bash
cd apps/api
pnpm prisma migrate dev --name migration_name
```

### Migration History

Migrations are stored in `apps/api/prisma/migrations/` and tracked in the `_prisma_migrations` table.

## Backup and Recovery

### Backup Strategy

1. **Automated Daily Backups**: Full database dump
2. **Point-in-Time Recovery**: WAL archiving enabled
3. **Retention**: 30 days

### Backup Command

```bash
pg_dump -h localhost -U postgres -d textbook_compiler > backup.sql
```

### Restore Command

```bash
psql -h localhost -U postgres -d textbook_compiler < backup.sql
```

## Data Integrity

### Constraints

- Foreign key constraints enforce referential integrity
- Unique constraints prevent duplicates
- NOT NULL constraints ensure required fields
- Cascade deletes maintain consistency

### Transactions

All write operations use transactions to ensure atomicity:

```typescript
await prisma.$transaction([
  prisma.module.create({ ... }),
  prisma.moduleVersion.create({ ... }),
  prisma.moduleTag.createMany({ ... }),
]);
```

## Prisma Client Usage

### Basic CRUD

```typescript
// Create
const module = await prisma.module.create({
  data: {
    title: 'Example',
    type: 'definition',
    courseId: 'course-id',
    authorId: 'user-id',
  },
});

// Read
const module = await prisma.module.findUnique({
  where: { id: 'module-id' },
  include: {
    versions: true,
    tags: true,
  },
});

// Update
const module = await prisma.module.update({
  where: { id: 'module-id' },
  data: { title: 'New Title' },
});

// Delete
await prisma.module.delete({
  where: { id: 'module-id' },
});
```

### Relations

```typescript
// Create with relations
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
      create: [
        { tag: 'math' },
        { tag: 'calculus' },
      ],
    },
  },
  include: {
    versions: true,
    tags: true,
  },
});
```

## Schema Evolution

### Adding a New Field

1. Update `schema.prisma`
2. Create migration: `pnpm prisma migrate dev --name add_field`
3. Update TypeScript types
4. Update API routes
5. Update frontend

### Removing a Field

1. Mark as optional in `schema.prisma`
2. Deploy (ensure no code uses the field)
3. Remove field from `schema.prisma`
4. Create migration

### Renaming a Field

Use a three-step process:
1. Add new field
2. Migrate data
3. Remove old field

## Performance Monitoring

### Slow Query Log

Enable in PostgreSQL:
```sql
ALTER DATABASE textbook_compiler SET log_min_duration_statement = 1000;
```

### Query Analysis

```sql
EXPLAIN ANALYZE
SELECT * FROM modules WHERE course_id = 'course-id';
```

### Connection Pooling

Prisma automatically manages connection pooling. Configure in `DATABASE_URL`:
```
postgresql://user:pass@host:5432/db?connection_limit=10
```

## Future Enhancements

1. **Full-Text Search**: Add GIN index for text search
2. **Soft Deletes**: Add `deletedAt` timestamp instead of hard deletes
3. **Audit Log**: Track all changes for compliance
4. **Sharding**: Partition by course for horizontal scaling
5. **Read Replicas**: Separate read/write connections


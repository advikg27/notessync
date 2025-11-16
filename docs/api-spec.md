# API Specification

Base URL: `http://localhost:3000`

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Authentication

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response** (201):
```json
{
  "user": {
    "id": "clx...",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "user": {
    "id": "clx...",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "user": {
    "id": "clx...",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Courses

### Create Course
```http
POST /courses/
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Calculus I"
}
```

**Response** (201):
```json
{
  "course": {
    "id": "clx...",
    "name": "Calculus I",
    "ownerId": "clx...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "owner": {
      "id": "clx...",
      "name": "John Doe"
    }
  }
}
```

### List User's Courses
```http
GET /courses/
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "courses": [
    {
      "id": "clx...",
      "name": "Calculus I",
      "ownerId": "clx...",
      "owner": {
        "id": "clx...",
        "name": "John Doe"
      },
      "_count": {
        "modules": 15,
        "memberships": 3
      }
    }
  ]
}
```

### Get Course
```http
GET /courses/:id
Authorization: Bearer <token>
```

### Get Course Modules
```http
GET /courses/:id/modules
Authorization: Bearer <token>
```

### Enroll in Course
```http
POST /courses/:id/enroll
Authorization: Bearer <token>
```

### Update Course
```http
PUT /courses/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Calculus I - Fall 2024"
}
```

### Delete Course
```http
DELETE /courses/:id
Authorization: Bearer <token>
```

## Modules

### Create Module
```http
POST /modules/
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": "clx...",
  "type": "definition",
  "title": "Definition of Derivative",
  "contentMarkdown": "# Derivative\n\nThe derivative measures...",
  "tags": ["calculus", "derivatives"]
}
```

**Module Types**: `definition`, `example`, `explanation`, `diagram`, `proof`, `problem`

**Response** (201):
```json
{
  "module": {
    "id": "clx...",
    "courseId": "clx...",
    "authorId": "clx...",
    "type": "definition",
    "title": "Definition of Derivative",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "author": {
      "id": "clx...",
      "name": "John Doe"
    },
    "versions": [
      {
        "id": "clx...",
        "versionNumber": 1,
        "contentMarkdown": "# Derivative\n\nThe derivative measures...",
        "contentHtml": "<h1>Derivative</h1><p>The derivative measures...</p>",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "tags": [
      { "id": "clx...", "tag": "calculus" },
      { "id": "clx...", "tag": "derivatives" }
    ]
  }
}
```

### List Modules
```http
GET /modules/?courseId=clx...&type=definition&tag=calculus&search=derivative
Authorization: Bearer <token>
```

**Query Parameters**:
- `courseId` (optional): Filter by course
- `type` (optional): Filter by module type
- `tag` (optional): Filter by tag
- `search` (optional): Search in title

**Response** (200):
```json
{
  "modules": [
    {
      "id": "clx...",
      "title": "Definition of Derivative",
      "type": "definition",
      "author": {
        "id": "clx...",
        "name": "John Doe"
      },
      "tags": [...],
      "versions": [...],
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Module
```http
GET /modules/:id
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "module": {
    "id": "clx...",
    "title": "Definition of Derivative",
    "type": "definition",
    "author": {...},
    "tags": [...],
    "versions": [...],
    "outgoingRefs": [
      {
        "referencedModule": {
          "id": "clx...",
          "title": "Limit Definition",
          "type": "definition"
        }
      }
    ],
    "incomingRefs": [...]
  }
}
```

### Update Module
```http
PUT /modules/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "contentMarkdown": "Updated content...",
  "tags": ["new", "tags"]
}
```

Creates a new version automatically.

### Get Module Versions
```http
GET /modules/:id/versions
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "versions": [
    {
      "id": "clx...",
      "versionNumber": 2,
      "contentMarkdown": "...",
      "contentHtml": "...",
      "createdAt": "2024-01-02T00:00:00.000Z"
    },
    {
      "id": "clx...",
      "versionNumber": 1,
      "contentMarkdown": "...",
      "contentHtml": "...",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Restore Module Version
```http
POST /modules/:id/restore
Authorization: Bearer <token>
Content-Type: application/json

{
  "versionNumber": 1
}
```

Creates a new version with the content of the specified version.

### Delete Module
```http
DELETE /modules/:id
Authorization: Bearer <token>
```

**Response** (204): No content

## Compiler

### Compile Modules
```http
POST /compiler/compile
Authorization: Bearer <token>
Content-Type: application/json

{
  "moduleIds": ["clx1...", "clx2...", "clx3..."],
  "format": "pdf",
  "title": "My Calculus Textbook"
}
```

**Parameters**:
- `moduleIds`: Array of module IDs in desired order
- `format`: `"html"` or `"pdf"`
- `title` (optional): Textbook title

**Response for HTML** (200):
```
Content-Type: text/html

<!DOCTYPE html>
<html>
  ...compiled HTML...
</html>
```

**Response for PDF** (200):
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="textbook.pdf"

<binary PDF data>
```

### Get Dependency Graph
```http
GET /compiler/dependency-graph/:moduleId
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "graph": {
    "clx1...": {
      "id": "clx1...",
      "title": "Definition of Derivative",
      "type": "definition",
      "references": [
        {
          "id": "clx2...",
          "title": "Limit Definition",
          "type": "definition"
        }
      ]
    },
    "clx2...": {
      "id": "clx2...",
      "title": "Limit Definition",
      "type": "definition",
      "references": []
    }
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "error": "Not authorized"
}
```

### 404 Not Found
```json
{
  "error": "Module not found"
}
```

### 409 Conflict
```json
{
  "error": "User already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

Not currently implemented. Future implementation:
- 100 requests per minute per IP
- 1000 requests per hour per user

## Pagination

Not currently implemented. Future implementation:
```http
GET /modules/?page=1&limit=20
```

## Cross-Module References

Use `@module:ID` syntax in markdown content:

```markdown
See @module:clx123 for the definition.

The proof is shown in @module:clx456.
```

When compiled, these become clickable links to the referenced modules.

## WebSocket (Future)

Real-time collaboration features:
- Live editing
- Presence indicators
- Activity feeds


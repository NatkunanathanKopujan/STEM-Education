# Architecture Documentation

## System Architecture

```mermaid
flowchart TD
  Client[Browser / Mobile Browser] --> Frontend[React + Vite Frontend]
  Frontend --> API[Express REST API]
  API --> Auth[JWT Auth + RBAC]
  API --> Services[Domain Services]
  Services --> Repositories[Repositories]
  Repositories --> DB[(MySQL)]
  Services --> Files[(Uploads Storage)]
  Services --> AI[AI Provider Abstraction]
  API --> Logs[(Application / Audit / Security Logs)]
```

## Frontend Architecture

- `src/routes`: route definitions with `React.lazy` and `Suspense`.
- `src/layouts`: public and dashboard layouts.
- `src/pages`: role and module-specific screens.
- `src/components`: reusable UI, navigation, auth, teacher, and super-admin components.
- `src/services`: Axios-based API clients.
- `src/hooks`: reusable data, auth, debounce, and virtualization hooks.
- `src/context`: authentication and shared UI state.

## Backend Architecture

- `routes`: REST route definitions and middleware composition.
- `controllers`: HTTP request handling and response formatting.
- `services`: business orchestration and domain logic.
- `repositories` / `models`: MySQL persistence boundaries.
- `validators`: request validation with Express Validator.
- `middleware`: authentication, RBAC, rate limiting, performance, errors, and logging.
- `utils`: response, JWT, password, pagination, file, and formatting helpers.

## Database Architecture

MySQL is the transactional source of truth. Schema files and migrations define users, sessions, curriculum, materials, AI question banks, files, notifications, reports, audit logs, backups, restores, and system health records.

## Authentication Flow

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend
  participant API as Backend API
  participant DB as MySQL
  U->>FE: Submit credentials
  FE->>API: POST /api/auth/login
  API->>DB: Find user and verify password hash
  API->>DB: Record login attempt and session
  API-->>FE: JWT + sanitized user
  FE->>API: Authenticated requests with Bearer token
  API->>API: Verify JWT and attach req.user
```

## Authorization Flow

```mermaid
flowchart LR
  Request --> Authenticate[JWT middleware]
  Authenticate --> RoleGuard[Role guard]
  RoleGuard --> PermissionGuard[Permission middleware]
  PermissionGuard --> Controller[Controller]
  PermissionGuard --> Audit[Permission log / audit on denial]
```

## Quiz Flow

```mermaid
sequenceDiagram
  participant S as Student
  participant API as Quiz API
  participant AIQ as Question Bank
  participant DB as MySQL
  S->>API: Start quiz
  API->>AIQ: Select eligible questions
  API->>DB: Create attempt
  S->>API: Save answers
  API->>DB: Persist progress
  S->>API: Submit quiz
  API->>DB: Score and finalize attempt
  API-->>S: Result and review data
```

## AI Processing Flow

```mermaid
flowchart TD
  Upload[Material / Prompt] --> Extract[Text Extraction]
  Extract --> Prompt[Prompt Builder]
  Prompt --> Provider[AI Provider Manager]
  Provider --> Parse[Response Parser]
  Parse --> Validate[Question Validation]
  Validate --> Duplicate[Duplicate Detection]
  Duplicate --> Store[Question Bank Storage]
  Store --> Logs[Generation Logs and Metrics]
```

## File Upload Flow

```mermaid
sequenceDiagram
  participant U as User
  participant API as File API
  participant FS as Local Storage
  participant DB as MySQL
  U->>API: Upload file
  API->>API: Validate type, size, permissions
  API->>FS: Store binary
  API->>DB: Store metadata/version
  API-->>U: File metadata
```

## Report Generation Flow

Reports are served by report services that query optimized repository methods, format dashboard/export payloads, and return CSV/PDF/Excel-ready structures through standardized responses.

## Notification Flow

Announcements and notifications are created by authorized users or system services, stored in MySQL, filtered by recipient role/user, and displayed in notification center pages.

## Deployment Architecture

```mermaid
flowchart LR
  Internet --> Nginx[Nginx TLS / Static / Proxy]
  Nginx --> React[React Static Assets]
  Nginx --> API[Node API / PM2 or Container]
  API --> MySQL[(MySQL)]
  API --> Uploads[(Persistent Upload Volume)]
  API --> AI[AI Providers]
  API --> Logs[(Logs)]
```

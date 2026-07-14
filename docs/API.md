# API Documentation

## Base URLs

- Local backend: `http://localhost:5000`
- API prefix: `/api`
- Health prefix: `/health`

## Authentication

Protected endpoints require:

```http
Authorization: Bearer <jwt>
```

## Standard Responses

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "errors": [],
  "timestamp": "2026-07-06T00:00:00.000Z",
  "statusCode": 200
}
```

Validation error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "path": "fieldName", "msg": "Message" }],
  "timestamp": "2026-07-06T00:00:00.000Z",
  "statusCode": 422
}
```

## Endpoint Groups

### Authentication

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/verify`
- `PUT /api/auth/change-password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### User and Role Management

CRUD-style endpoints exist for:

- `/api/super-admin`
- `/api/admin`
- `/api/teacher`
- `/api/student`

Common operations:

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

Role and permission middleware restrict write access.

### Curriculum and Materials

- `/api/curriculum`
- `/api/materials`

These use CRUD patterns, validation, RBAC, pagination, filtering, and standard responses.

### Files

- `POST /api/files/upload`
- `POST /api/files/chunk`
- `GET /api/files/storage/statistics`
- `GET /api/files`
- `GET /api/files/:id`
- `PUT /api/files/:id`
- `DELETE /api/files/:id`
- `GET /api/files/download/:id`
- `GET /api/files/preview/:id`
- `GET /api/files/history/:id`
- `POST /api/files/restore-version/:id`

### AI

- Text extraction, knowledge upload, question generation, batch generation, regeneration, validation, provider/model listing, logs, costs, question bank CRUD, and topic listing are available under `/api/ai`.

### Quiz

- General quiz APIs are under `/api/quiz`.
- Student quiz APIs are under `/api/student/quiz`.

Student quiz workflow:

- `POST /api/student/quiz/start`
- `GET /api/student/quiz/current`
- `POST /api/student/quiz/save-answer`
- `POST /api/student/quiz/submit`
- `GET /api/student/quiz/history`
- `GET /api/student/quiz/result/:quizNumber`
- `GET /api/student/quiz/review/:quizNumber`

### Reports

- `GET /api/reports/dashboard`
- `GET /api/reports/students`
- `GET /api/reports/teachers`
- `GET /api/reports/quizzes`
- `GET /api/reports/materials`
- `GET /api/reports/ai`
- `GET /api/reports/export`
- `POST /api/reports/export/pdf`
- `POST /api/reports/export/excel`
- `POST /api/reports/export/csv`

### Notifications and Announcements

- `/api/notifications`
- `/api/announcements`
- `/api/notification-preferences`

### Profile

- `GET /api/profile`
- `PUT /api/profile`
- `POST /api/profile/upload-photo`
- `DELETE /api/profile/photo`
- `PUT /api/profile/change-password`
- `GET /api/profile/login-history`
- `GET /api/profile/sessions`
- `DELETE /api/profile/sessions/:id`
- `DELETE /api/profile/sessions`
- `GET /api/profile/preferences`
- `PUT /api/profile/preferences`

### Search

- `GET /api/search`
- `GET /api/search/suggestions`
- `GET /api/search/history`
- `DELETE /api/search/history`
- `POST /api/search/save`
- `GET /api/search/saved`
- `PUT /api/search/saved/:id`
- `DELETE /api/search/saved/:id`
- `GET /api/search/analytics`

### Security and Backup

- `GET /api/security/dashboard`
- `GET /api/security/audit-logs`
- `GET /api/security/activity`
- `GET /api/security/alerts`
- `GET /api/security/login-history`
- `POST /api/security/lock-user`
- `POST /api/security/unlock-user`
- `POST /api/security/backup`
- `GET /api/security/backups`
- `POST /api/security/restore`
- `GET /api/security/restores`
- `GET /api/security/system-health`

### Performance and Health

- `GET /api/performance/dashboard`
- `GET /health`
- `GET /health/database`
- `GET /health/storage`
- `GET /health/ai`
- `GET /health/system`

## OpenAPI

The machine-readable OpenAPI spec is available at `docs/api/openapi.yaml`.

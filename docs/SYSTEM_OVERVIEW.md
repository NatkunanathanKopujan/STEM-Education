# System Overview

AI Smart LMS is a modular learning platform for managing academic users, curriculum, learning materials, quizzes, AI-assisted question generation, reports, notifications, files, security, and operational monitoring.

## Primary Roles

- Super Admin: manages the entire system, security, users, backups, performance, and configuration.
- Admin: manages teachers, students, curriculum, materials, reports, and communications.
- Teacher: uploads content, manages topics, generates AI questions, reviews quiz analytics, and monitors students.
- Student: views materials, takes quizzes, submits assignments, checks results, and receives notifications.

## Core Capabilities

- Authentication and authorization through JWT, roles, and permissions.
- User and curriculum management.
- AI knowledge extraction and question generation.
- Student quiz workflows and teacher analytics.
- File uploads, previews, downloads, version history, and storage statistics.
- Reports and exports.
- Notifications and announcements.
- Search and saved searches.
- Audit logs, security alerts, login history, backup/restore metadata, and health monitoring.

## Standard API Response

All API responses use this shape:

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

## Operational Profile

The project is prepared for local development, Ubuntu deployment, Docker Compose, Nginx reverse proxying, PM2 process management, MySQL persistence, persistent uploads, health checks, and CI/CD verification.

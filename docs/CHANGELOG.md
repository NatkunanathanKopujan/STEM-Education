# Changelog

## Version 1.0.0

Release date: 2026-07-06

### Release Notes

Initial enterprise-ready AI Smart LMS foundation with role-based dashboards, academic workflows, AI question generation, reporting, notifications, file management, security, performance monitoring, deployment assets, and documentation.

### Features Added

- Authentication and RBAC.
- Super Admin, Admin, Teacher, and Student workflows.
- Curriculum and learning materials.
- File uploads, previews, downloads, versioning, and storage statistics.
- AI provider abstraction, question generation, validation, duplicate detection, retries, logs, and costs.
- Student quiz attempts, quiz history, results, and review.
- Teacher analytics and reports.
- Notifications and announcements.
- Global search, saved searches, and analytics.
- Audit logs, login attempts, security alerts, permission logs.
- Backup and restore metadata.
- Performance dashboard, cache service, metrics, and health APIs.
- Docker, Nginx, PM2, CI, deployment scripts, and production documentation.

### Known Issues

- Docker Compose validation requires Docker installed locally.
- External AI provider tests should use mocks or local provider in CI.
- Destructive restore execution is intentionally reserved for approved operational workers.

### Future Roadmap

- Redis sessions and cache.
- Queue workers for AI, reports, notifications, backups, and video processing.
- Cloud object storage providers.
- Prometheus metrics endpoint and OpenTelemetry exporters.
- Cloud deployment templates.

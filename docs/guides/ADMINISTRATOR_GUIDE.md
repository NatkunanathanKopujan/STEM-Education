# Administrator Guide

## System Configuration

Administrators configure environment variables, academic settings, security settings, storage provider settings, and notification preferences according to deployment policy.

## User Management

- Super Admin can create and manage Admin users.
- Admin users can manage Teacher and Student records when authorized.
- Account status can be active, inactive, or locked.

## Curriculum Management

Curriculum records organize academic topics, lessons, subjects, and teaching progression. Teachers and students interact with curriculum through material and quiz workflows.

## AI Management

Monitor AI providers, models, generation logs, costs, question bank entries, duplicate detection, and validation status.

## Reports

Reports cover students, teachers, quizzes, materials, AI, and dashboard summaries. Export permissions control CSV/PDF/Excel output.

## Monitoring

Use:

- `/health` endpoints for operational health.
- Performance dashboard for API timing, cache, memory, AI, and file metrics.
- Security dashboard for alerts, audit logs, failed logins, active sessions, backup status, and system health.

## Backup and Restore

- Run manual backups from the security dashboard or `deploy/backup.sh`.
- Validate restore requests before destructive operations.
- Keep offsite copies of database, uploads, and configuration backups.

## Security

Review audit logs, permission logs, failed login attempts, account locks, alerts, and backup history regularly.

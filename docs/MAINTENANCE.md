# Maintenance Guide

## Routine Tasks

- Review audit logs and security alerts.
- Verify backups complete successfully.
- Check `/health` endpoints.
- Review storage usage.
- Review performance dashboard for slow APIs and cache hit rate.
- Rotate secrets according to policy.

## Backup Schedule

Recommended:

- Daily database backup.
- Daily upload archive for active environments.
- Backup configuration after every deployment change.
- Retain offsite copies.

## Upgrade Process

1. Announce maintenance window.
2. Back up database, uploads, and configuration.
3. Deploy new application version.
4. Apply migrations.
5. Restart services.
6. Verify health endpoints.
7. Smoke-test login, dashboards, uploads, quizzes, AI, reports, and notifications.

## Log Review

Review:

- Backend application logs.
- API access logs.
- Nginx logs.
- PM2 logs.
- Security and audit tables.

## Incident Response

1. Identify affected service.
2. Check health endpoints.
3. Review logs and recent deployment changes.
4. Restore service or roll back deployment.
5. Document root cause and remediation.

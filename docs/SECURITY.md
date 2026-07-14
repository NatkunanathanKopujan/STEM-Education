# Security Documentation

## Authentication

The LMS uses JWT bearer tokens. Tokens are issued at login and verified by authentication middleware before protected routes execute.

## Authorization

Authorization uses:

- Role guards for Super Admin, Admin, Teacher, and Student.
- Granular permission middleware for actions such as user management, uploads, reports, AI, backups, restores, and audit access.
- Permission logs and audit logs for traceability.

## Password Security

Passwords are hashed with bcrypt. Raw passwords are never returned by API responses.

## Rate Limiting

Global API rate limiting and login-specific rate limiting protect against brute-force and excessive request activity.

## Validation

Express Validator validates request bodies, parameters, and query strings. Invalid requests return standardized 422 responses.

## File Security

File uploads are validated for type, size, metadata, and role permissions. Nginx and backend upload limits are both configurable.

## Audit and Alerts

Security tables record:

- Login attempts.
- Audit logs.
- Permission checks.
- Security alerts.
- Backup and restore history.

## Recovery

The backup module records backup manifests and restore validation metadata. Operational backup scripts are available under `deploy`.

## Best Practices

- Use strong `JWT_SECRET` values.
- Keep `.env` files out of source control.
- Use HTTPS in production.
- Restrict database network access.
- Rotate provider API keys.
- Monitor `/health` endpoints and security dashboards.

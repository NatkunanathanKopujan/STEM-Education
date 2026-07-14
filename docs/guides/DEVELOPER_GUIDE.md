# Developer Guide

## Project Structure

- `frontend/src/pages`: screen-level pages.
- `frontend/src/components`: reusable UI and feature components.
- `frontend/src/services`: API clients.
- `backend/routes`: route declarations.
- `backend/controllers`: request and response orchestration.
- `backend/services`: business and domain logic.
- `backend/repositories` and `backend/models`: persistence access.
- `backend/validators`: request validation.
- `backend/middleware`: cross-cutting middleware.

## Coding Standards

- Keep business logic in services.
- Keep controllers thin.
- Validate all input at route boundaries.
- Use existing utilities for API responses, pagination, JWTs, passwords, IDs, and errors.
- Reuse components and hooks before adding new abstractions.

## API Development

1. Add or update validator.
2. Add service function.
3. Add repository/model function if persistence is needed.
4. Add controller method.
5. Wire route with auth, RBAC, validation, and middleware.
6. Add tests and documentation.

## Frontend Development

1. Reuse existing UI components.
2. Place API calls in `src/services`.
3. Use hooks for shared state and data behavior.
4. Keep route pages focused on composition.
5. Use responsive layouts and accessible form controls.

## Testing

Run:

```bash
npm test
npm run test:coverage
npm run test:e2e
```

Use fixtures and helpers under `backend/tests` and `frontend/tests`.

## Deployment

Use Docker Compose, PM2, or Linux service deployment as documented in `docs/DEPLOYMENT.md`.

## Contribution Checklist

- Lint passes.
- Tests pass.
- New endpoints have validation.
- Security and RBAC are respected.
- Documentation is updated.
- No secrets are committed.

# AI Smart LMS Testing Guide

## Test Layers

- Frontend unit tests: React Testing Library + Jest under `frontend/tests`.
- Backend unit tests: Jest under `backend/tests/unit`.
- API integration tests: Supertest under `backend/tests/api`.
- Performance templates: Jest scenario contracts under `backend/tests/performance`.
- End-to-end tests: Playwright under `tests/e2e`.

## Commands

```bash
npm test
npm run test:coverage
npm run test:e2e
npm run test --workspace backend
npm run test --workspace frontend
```

## Coverage

Jest coverage uses Istanbul and targets 90% for statements, branches, functions, and lines.

Coverage output:

- Backend: `backend/coverage`
- Frontend: `frontend/coverage`

## Mocking Guide

- Keep database-heavy tests behind repository mocks or API boundary tests.
- Mock AI providers in automated tests; never call paid or external AI services in CI.
- Use `backend/tests/fixtures` and `frontend/tests/fixtures` for reusable users, files, quizzes, reports, and notifications.
- Use `backend/tests/helpers` for HTTP/auth helpers and `frontend/tests/utils` for provider-wrapped rendering.

## API Test Guidance

Every REST module should have tests for:

- Missing token
- Invalid token
- Role denial
- Validation failure
- Success response
- Pagination/filter/sort behavior
- 404 for missing records

## E2E Guidance

Playwright uses `E2E_BASE_URL` and reuses an existing Vite server if available.

Optional credentials:

```bash
E2E_SUPER_ADMIN_USER=superadmin@example.com
E2E_SUPER_ADMIN_PASSWORD=ChangeMe123
```

## Troubleshooting

- If frontend tests fail on browser APIs, add a focused polyfill in `frontend/tests/setupTests.js`.
- If backend tests need database behavior, mock repositories first; use a disposable MySQL schema only for migration validation.
- If E2E tests redirect to login, seed the test database or use storage-state authentication.
- If coverage is below 90%, add tests around services and validators before snapshot-style tests.

## CI Preparation

The suite is ready for GitHub Actions, GitLab CI, Azure DevOps, or Jenkins:

1. Install dependencies with `npm ci`.
2. Run `npm run lint`.
3. Run `npm run test:coverage`.
4. Run `npm run build:frontend`.
5. Run `npm run test:e2e` against a seeded test environment.

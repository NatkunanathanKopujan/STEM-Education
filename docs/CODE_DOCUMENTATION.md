# Code Documentation Guide

## Backend Documentation Map

- Controllers document HTTP intent and call service functions.
- Services contain business workflows and should be documented when logic spans multiple repositories or external systems.
- Repositories document persistence assumptions, filtering, pagination, and joins.
- Middleware documents cross-cutting behavior such as auth, RBAC, rate limiting, caching, errors, and logging.
- Validators document request rules at the API boundary.
- Utilities document reusable helpers such as JWT, password, pagination, file, and response helpers.

## JSDoc Standard

Use JSDoc for non-obvious exported functions:

```js
/**
 * Records a security-relevant action for audit review.
 * @param {object} payload
 * @param {object|null} payload.user Authenticated user context.
 * @param {string} payload.action Stable action name.
 * @param {string} payload.module Functional module name.
 * @returns {Promise<void>}
 */
```

## Controller Documentation

Controllers should describe:

- Route purpose.
- Required authentication and authorization.
- Expected request parameters.
- Service call.
- Response shape.

## Service Documentation

Services should describe:

- Business workflow.
- Important side effects.
- Transaction or rollback assumptions.
- External provider behavior.
- Audit, alert, cache, or metrics effects.

## API Documentation

Keep `docs/API.md` and `docs/api/openapi.yaml` updated whenever public routes, request shapes, or response contracts change.

## Configuration Documentation

Document every new environment variable in `docs/CONFIGURATION.md` and the relevant `.env.*.example` file.

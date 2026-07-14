# FAQ

## Developers

### Where do I add a new API endpoint?
Add validation, service logic, controller method, and route entry under `backend`.

### How are API responses formatted?
Use `sendSuccess` and `sendError` from `backend/utils/apiResponse.js`.

### How do I test without calling external AI providers?
Use the local provider or mock provider modules in Jest tests.

## Administrators

### How do I unlock a user?
Use the Security Dashboard or the protected security unlock endpoint.

### How do I back up the system?
Use the backup module or run `deploy/backup.sh` with production environment variables.

### How do I monitor system health?
Use `/health`, `/health/database`, `/health/storage`, `/health/ai`, `/health/system`, and the Performance/Security dashboards.

## Teachers

### Why can a quiz not be generated for a topic?
Questions are generated for eligible taught/completed content. Check topic status and AI provider configuration.

### Where can I review student performance?
Use Teacher Analytics, quiz reports, and student result views.

## Students

### Why can I not start a quiz?
The quiz may require completed/taught topics or available generated questions.

### Where are my results?
Use Student Results, Marks, Quiz History, and Reports pages.

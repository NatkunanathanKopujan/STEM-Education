# Project Standards

## Coding Standards

- Use clear module boundaries.
- Prefer existing utilities and services.
- Keep controllers thin.
- Validate all external input.
- Do not hardcode secrets.
- Keep files ASCII unless existing content requires otherwise.

## Naming Conventions

- React components: `PascalCase.jsx`.
- Hooks: `useThing.js`.
- Services: `thingService.js`.
- Controllers: `thingController.js`.
- Routes: `thingRoutes.js`.
- Validators: `thingValidators.js`.
- Tests: `thing.test.js` or `Thing.test.jsx`.

## Git Workflow

- Use feature branches.
- Keep commits focused.
- Open pull requests for review.
- Run lint and tests before merging.

## Branch Naming

- `feature/<short-name>`
- `fix/<short-name>`
- `docs/<short-name>`
- `chore/<short-name>`

## Commit Messages

Recommended format:

```text
type(scope): short summary
```

Examples:

- `feat(security): add restore history endpoint`
- `test(auth): add API validation coverage`
- `docs(deploy): add Docker production guide`

## Folder Naming

Use lowercase folder names. Use feature folders only when they group related files cleanly.

# Testing Guidelines

The TODO app should follow these testing principles and conventions.

## General Principles

- All new features should include appropriate automated tests.
- Tests must be isolated and independent. Each test should create or arrange its own data and must not rely on other tests.
- Setup and teardown hooks are required where appropriate so the full suite can run successfully multiple times.
- Tests should be maintainable, readable, and aligned with established best practices.
- Test file names should clearly describe what they validate.

## Unit Tests

- Use Jest for unit testing individual functions and React components in isolation.
- Unit test files should use the naming convention `*.test.js` or `*.test.ts`.
- Backend unit tests should be placed in `packages/backend/__tests__/`.
- Frontend unit tests should be placed in `packages/frontend/src/__tests__/`.
- Unit test file names should match the feature or module being tested, for example `app.test.js` for `app.js`.

## Integration Tests

- Use Jest and Supertest to validate backend API endpoints with real HTTP requests.
- Integration tests should be placed in `packages/backend/__tests__/integration/`.
- Integration test files should use the naming convention `*.test.js` or `*.test.ts`.
- Integration test file names should clearly reflect the API area they cover, for example `todos-api.test.js`.

## End-to-End Tests

- Use Playwright for end-to-end browser-based workflow testing.
- E2E tests should be placed in `tests/e2e/`.
- E2E test files should use the naming convention `*.spec.js` or `*.spec.ts`.
- E2E test file names should reflect the user journey under test, for example `todo-workflow.spec.js`.
- Playwright tests must use only one browser.
- Playwright tests must use the Page Object Model (POM) pattern for maintainability.
- Limit E2E coverage to 5 to 8 critical user journeys, focusing on happy paths and key edge cases rather than exhaustive coverage.

## Port Configuration

- Always use environment variables with sensible defaults for port configuration.
- Backend applications should use `const PORT = process.env.PORT || 3030;`.
- Frontend applications may use React’s default port `3000`, but must allow override through the `PORT` environment variable.
- This configuration should support CI/CD workflows that need to detect or assign ports dynamically.

## Intent

The project should maintain a balanced automated testing strategy with fast unit tests, meaningful integration coverage, and a focused set of maintainable end-to-end tests that validate critical user behavior.
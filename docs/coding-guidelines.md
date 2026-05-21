# Coding Guidelines

This project should favor clear, consistent, and maintainable code over clever shortcuts. Because the repository is primarily JavaScript with supporting HTML and CSS, contributors should keep implementation style simple, readable, and easy for others to extend.

## Formatting and Readability

Use consistent indentation and spacing throughout the codebase, and follow the established formatting already present in each file. Keep functions and components focused on a single responsibility, prefer descriptive variable and function names, and avoid deeply nested logic when a small helper function or early return would improve readability.

When writing JavaScript, prefer modern language features when they improve clarity, but avoid patterns that make the code harder to understand for new contributors. In HTML and CSS, keep structure and naming predictable so the UI remains easy to update.

## Import and File Organization

Organize imports in a clean and consistent order. Group related imports together, keeping built-in or framework dependencies separate from local modules when applicable. Remove unused imports and avoid adding dependencies unless they provide clear value.

Files should have a clear purpose. If a file starts handling multiple responsibilities, split logic into smaller modules or helper utilities. Shared behavior should live in reusable functions rather than being copied into multiple places.

## Linting and Code Quality

Use the project’s linting and formatting tools as the baseline for style decisions. If linting is configured, treat warnings and errors as actionable feedback and resolve them before considering work complete. New code should match the conventions enforced by the repository so that automated checks remain reliable.

Write code that is easy to test, and prefer predictable, side-effect-conscious functions where possible. Keep changes small and intentional, and avoid introducing unnecessary complexity.

## Best Practices

Follow the DRY principle by extracting repeated logic into reusable helpers, while avoiding abstraction that hides simple behavior. Prefer straightforward solutions first, then refactor when duplication or complexity becomes a pattern.

Make quality a default expectation: handle edge cases thoughtfully, preserve existing behavior unless a change is intentional, and keep code aligned with the project’s documentation and testing guidance. When in doubt, choose the approach that improves maintainability, consistency, and developer understanding.

# Coding Guidelines

This project values clear, consistent, and maintainable code. Use formatting conventions that keep files easy to read, including consistent indentation, sensible line lengths, and descriptive naming for variables, functions, and components. Prefer simple, explicit code over clever shortcuts so that future contributors can understand intent quickly.

Organize imports in a predictable way. Group standard library or framework imports first, followed by third-party dependencies, and then local project modules. Keep related imports together and remove any unused imports to reduce noise. When possible, order imports consistently within each group to make files easier to scan.

Use linters and other automated quality checks as part of normal development. Address lint warnings before considering work complete, and treat linting as a tool to reinforce consistency rather than as an afterthought. If formatting or linting tools are configured in the project, follow their output instead of introducing custom style variations.

Favor the DRY principle by extracting repeated logic into reusable functions, components, or helpers when duplication starts to appear. At the same time, avoid over-abstracting too early; the goal is to share meaningful behavior without making the code harder to follow. Reuse should improve clarity as well as reduce maintenance effort.

Write code with quality and collaboration in mind. Keep functions focused on a single responsibility, prefer small and testable units, and add comments only when they provide useful context that the code itself cannot express. Make changes that fit naturally with the existing structure of the project and aim for code that is easy to extend, review, and test.

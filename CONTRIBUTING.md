# Contributing to Grafana Prometheus AI Assistant

Thank you for your interest in contributing! This document provides guidelines for contributing to this Chrome extension.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Run tests: `npm test`
6. Run linter: `npm run lint`
7. Format code: `npm run format`
8. Build: `npm run build`
9. Test the extension manually in Chrome
10. Commit and push your changes
11. Create a pull request

## Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier configurations provided
- Write descriptive variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Testing

- Write tests for new features
- Ensure existing tests pass
- Aim for high code coverage
- Test manually in different Grafana versions when possible

## Commit Messages

Use clear, descriptive commit messages:
- `feat: add support for CodeMirror 6`
- `fix: button injection in Grafana 9.x`
- `docs: update configuration guide`
- `test: add tests for editor detection`

## Pull Request Process

1. Update README.md with any new configuration options
2. Update tests as needed
3. Ensure all tests pass
4. Update documentation if you're changing functionality
5. Link any related issues in the PR description

## Questions?

Open an issue for discussion before starting work on major changes.

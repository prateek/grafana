# Contributing Guide

Thank you for your interest in contributing to the Grafana PromQL AI Assistant extension!

## Development Setup

### Prerequisites
- Node.js 18+
- Chrome browser
- Git
- Code editor (VS Code recommended)

### Clone and Setup
```bash
git clone <repository-url>
cd chrome-extension
npm install
```

### Development Workflow
1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run tests: `npm test`
4. Run linter: `npm run lint:fix`
5. Build: `npm run build`
6. Test manually in Chrome
7. Commit and push
8. Create pull request

## Code Style

### TypeScript
- Use strict TypeScript
- Prefer `const` over `let`
- Use meaningful variable names
- Add JSDoc comments for exported functions
- Use `interface` for public APIs, `type` for unions

### Example
```typescript
/**
 * Detect Prometheus query editors in the DOM
 * @param container - Root element to search within
 * @returns Array of detected editor contexts
 */
export function findPromEditors(container: HTMLElement): EditorContext[] {
  // Implementation
}
```

### Formatting
- We use Prettier - run `npm run format`
- 100 character line limit
- 2-space indentation
- Single quotes for strings
- Trailing commas in objects/arrays

### Linting
- We use ESLint - run `npm run lint`
- Fix automatically: `npm run lint:fix`
- No `console.log` (use `debugLog` helper)
- No `any` types (use `unknown` if needed)

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With UI
npx vitest --ui

# Run specific test file
npx vitest tests/promEditorDetector.test.ts
```

### Writing Tests
- Put tests in `tests/` directory
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert
- Clean up in `afterEach` hooks

#### Example Test
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('MyFeature', () => {
  beforeEach(() => {
    // Setup
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Cleanup
    document.body.innerHTML = '';
  });

  it('should do something specific', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Test Coverage
- Aim for >80% coverage
- All new features must have tests
- Test both success and error cases

## Architecture

### Module Organization
```
src/
├── config.ts              # Configuration (start here)
├── types.ts               # TypeScript interfaces
├── contentScript.ts       # Main entry point
├── promEditorDetector.ts  # Editor detection logic
├── editorRegistry.ts      # State management
├── buttonInjector.ts      # UI injection
├── overlayManager.ts      # Overlay panel
├── messageHandler.ts      # PostMessage protocol
└── background.ts          # Service worker
```

### Design Principles
1. **Separation of Concerns**: Each module has a single responsibility
2. **No Side Effects**: Functions are pure where possible
3. **Defensive Coding**: Check for null/undefined, validate inputs
4. **Configurability**: Hard-coded values go in `config.ts`
5. **Testability**: Design for easy testing

## Common Tasks

### Adding a New Editor Type

1. Update `types.ts`:
```typescript
export type EditorType = 'monaco' | 'codemirror' | 'textarea' | 'my-new-editor';
```

2. Update `promEditorDetector.ts`:
```typescript
function detectEditorType(element: HTMLElement): EditorType {
  if (element.classList.contains('my-new-editor')) {
    return 'my-new-editor';
  }
  // ... existing logic
}

function getMyNewEditorQueryText(element: HTMLElement): string {
  // Implementation
}

function setMyNewEditorQueryText(element: HTMLElement, query: string): void {
  // Implementation
}
```

3. Add tests in `tests/promEditorDetector.test.ts`

### Adding a New Message Type

1. Update `types.ts`:
```typescript
export enum MessageType {
  // ... existing types
  MY_NEW_MESSAGE = 'my_new_message',
}

export interface MyNewMessage {
  type: MessageType.MY_NEW_MESSAGE;
  data: string;
  timestamp: number;
}

export type ExtensionMessage =
  | PromQLContextMessage
  | PromQLSuggestionMessage
  | CloseOverlayMessage
  | MyNewMessage;
```

2. Update `messageHandler.ts`:
```typescript
function handleMessage(event: MessageEvent): void {
  // ... validation

  switch (message.type) {
    // ... existing cases
    case 'my_new_message':
      handleMyNewMessage(message as MyNewMessage);
      break;
  }
}

function handleMyNewMessage(message: MyNewMessage): void {
  // Implementation
}
```

3. Add tests in `tests/messageHandler.test.ts`

### Customizing Button Appearance

1. Edit `src/buttonInjector.ts` - `getIconSVG()` for icon
2. Edit `src/styles/content.css` for styling
3. Edit `src/config.ts` - `UI.BUTTON_LABEL` for text

### Adjusting for Grafana Versions

Edit `src/config.ts` - `PROM_EDITOR_SELECTORS`:
```typescript
containerSelectors: [
  '[data-testid="query-editor-row"]',  // Grafana 10.x
  '.query-editor-row',                  // Grafana 9.x
  '.your-custom-selector',              // Add new selectors here
],
```

## Pull Request Process

### Before Submitting
- [ ] All tests pass: `npm test`
- [ ] No lint errors: `npm run lint`
- [ ] Code is formatted: `npm run format`
- [ ] Build succeeds: `npm run build`
- [ ] Manually tested in Chrome
- [ ] Added tests for new features
- [ ] Updated README if needed

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested this

## Screenshots (if applicable)
Add screenshots

## Checklist
- [ ] Tests pass
- [ ] No lint errors
- [ ] Manually tested
```

## Debugging Tips

### Chrome DevTools
1. Open Grafana page
2. Right-click → Inspect
3. Console tab: See `[PromQL AI]` logs
4. Sources tab: Set breakpoints in extension code
5. Network tab: Monitor iframe loading

### Enable Debug Logging
In `src/config.ts`:
```typescript
DEBUG: {
  ENABLE_LOGGING: true,
  LOG_PREFIX: '[PromQL AI]',
}
```

### Common Issues

**Button not appearing:**
- Check `isPrometheusEditor()` logic
- Verify selectors match your Grafana DOM
- Check console for errors

**Query not inserting:**
- Verify editor type detection
- Check `setQueryText()` implementation
- Ensure events are dispatched

**Tests failing:**
- Clear dist folder: `rm -rf dist`
- Reinstall: `rm -rf node_modules && npm install`
- Check test DOM structure matches selectors

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run full test suite: `npm test`
4. Build production: `npm run build`
5. Manual testing in Chrome
6. Tag release: `git tag v1.0.0`
7. Push tags: `git push --tags`
8. Create GitHub release
9. Package extension: `cd dist && zip -r ../extension.zip .`

## Resources

### Useful Links
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/mv3/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Project Dependencies
- **Vite**: Build tool
- **Vitest**: Test framework
- **TypeScript**: Type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Questions?

- Check existing issues
- Review README.md
- Ask in discussions
- Open a new issue

## License

MIT - see LICENSE file

---

Thank you for contributing! 🎉

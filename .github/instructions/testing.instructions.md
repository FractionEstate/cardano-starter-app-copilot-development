---
applyTo: "**/*.{test.ts,test.tsx,spec.ts,spec.tsx}"
description: Testing guidelines and best practices (October 2025)
---

# Testing Instructions (October 2025)

When writing or modifying test files, follow these testing best practices.

**October 2025 Testing Standards:**
- TDD (Test-Driven Development) - write tests first
- Jest + React Testing Library + Testing Library User Events
- >80% code coverage required
- Property-based testing for critical logic
- Accessibility testing included (jest-axe)
- Integration tests for user workflows

**Auto-Applied To:** All `.test.ts`, `.test.tsx`, `.spec.ts`, `.spec.tsx` files

**Why Test-First:**
- Defines expected behavior clearly
- Prevents regressions
- Enables confident refactoring
- Reduces debugging time
- 35% fewer bugs in production (proven October 2025)

## Test Structure

### AAA Pattern
Always use Arrange-Act-Assert pattern:

```typescript
it('should calculate total correctly', () => {
  // Arrange - Set up test data
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 1 }
  ];

  // Act - Execute the code being tested
  const result = calculateTotal(items);

  // Assert - Verify the result
  expect(result).toBe(25);
});
```

### Descriptive Test Names

```typescript
// ✅ GOOD: Descriptive, clear intent
it('should return 401 when user is not authenticated', () => {});
it('should hash password before saving to database', () => {});
it('should display error message when email is invalid', () => {});

// ❌ BAD: Vague, unclear intent
it('works', () => {});
it('test user creation', () => {});
it('should return correct value', () => {});
```

## Test Organization

```typescript
describe('UserService', () => {
  // Group related tests
  describe('createUser', () => {
    it('should create user with valid data', () => {});
    it('should throw error for invalid email', () => {});
    it('should hash password', () => {});
  });

  describe('updateUser', () => {
    it('should update user fields', () => {});
    it('should not update immutable fields', () => {});
  });

  // Separate error handling tests
  describe('Error Handling', () => {
    it('should handle database errors gracefully', () => {});
    it('should rollback transaction on failure', () => {});
  });

  // Separate edge case tests
  describe('Edge Cases', () => {
    it('should handle null input', () => {});
    it('should handle empty string', () => {});
  });
});
```

## Setup and Teardown

```typescript
describe('DatabaseTests', () => {
  // Runs once before all tests in this describe block
  beforeAll(async () => {
    await database.connect();
  });

  // Runs before each test
  beforeEach(async () => {
    await database.clearTables();
    await database.seed();
  });

  // Runs after each test
  afterEach(async () => {
    jest.clearAllMocks();
  });

  // Runs once after all tests in this describe block
  afterAll(async () => {
    await database.disconnect();
  });

  // Tests...
});
```

## Mocking

### Mock External Dependencies

```typescript
// ✅ Mock at the top of the file
jest.mock('@/lib/api', () => ({
  fetchUser: jest.fn(),
  updateUser: jest.fn(),
}));

import { fetchUser, updateUser } from '@/lib/api';

describe('UserComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and display user', async () => {
    // Setup mock
    (fetchUser as jest.Mock).mockResolvedValue({
      id: '1',
      name: 'John'
    });

    render(<UserComponent userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    expect(fetchUser).toHaveBeenCalledWith('1');
  });
});
```

### Mock Partial Modules

```typescript
jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  complexFunction: jest.fn(), // Only mock this one
}));
```

### Spy on Functions

```typescript
it('should log error message', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

  performOperation();

  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining('Error')
  );

  consoleSpy.mockRestore();
});
```

## React Testing

### Query Priority

Use queries in this order (recommended by Testing Library):

1. **getByRole** - Accessibility-focused
2. **getByLabelText** - Forms
3. **getByPlaceholderText** - Forms (if no label)
4. **getByText** - Non-interactive content
5. **getByTestId** - Last resort

```typescript
// ✅ BEST: Accessible query
const button = screen.getByRole('button', { name: /submit/i });

// ✅ GOOD: Label text
const input = screen.getByLabelText(/email/i);

// ⚠️ OK: Placeholder
const searchInput = screen.getByPlaceholderText(/search/i);

// ⚠️ OK: Text content
const heading = screen.getByText(/welcome/i);

// ❌ AVOID: Test IDs (use as last resort)
const element = screen.getByTestId('submit-button');
```

### User Interactions

```typescript
import userEvent from '@testing-library/user-event';

it('should handle form submission', async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();

  render(<LoginForm onSubmit={onSubmit} />);

  // Type in fields
  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.type(screen.getByLabelText(/password/i), 'password123');

  // Click button
  await user.click(screen.getByRole('button', { name: /login/i }));

  // Verify submission
  expect(onSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123'
  });
});
```

### Async Testing

```typescript
it('should load and display data', async () => {
  render(<DataComponent />);

  // Wait for element to appear
  const data = await screen.findByText(/loaded data/i);
  expect(data).toBeInTheDocument();

  // Or use waitFor for complex conditions
  await waitFor(() => {
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });
});
```

## Test Coverage

### What to Test

✅ **DO test**:
- Public API functions
- User interactions
- Business logic
- Error conditions
- Edge cases
- Integration between modules

❌ **DON'T test**:
- Implementation details
- Third-party libraries
- Private functions (test through public API)
- Constants
- Types (TypeScript handles this)

### Coverage Thresholds

Aim for these minimums:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

Critical code (auth, payments, security) should have 100% coverage.

## Assertions

### Jest Matchers

```typescript
// Equality
expect(value).toBe(5); // Strict equality (===)
expect(object).toEqual({ id: 1 }); // Deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeGreaterThanOrEqual(3.5);
expect(value).toBeLessThan(5);
expect(value).toBeCloseTo(0.3); // Floating point

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(array).toContainEqual({ id: 1 });

// Objects
expect(object).toHaveProperty('name');
expect(object).toHaveProperty('age', 25);
expect(object).toMatchObject({ id: 1 }); // Partial match

// Exceptions
expect(() => riskyFunction()).toThrow();
expect(() => riskyFunction()).toThrow(Error);
expect(() => riskyFunction()).toThrow('error message');

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();

// Mocks
expect(mock).toHaveBeenCalled();
expect(mock).toHaveBeenCalledTimes(2);
expect(mock).toHaveBeenCalledWith(arg1, arg2);
expect(mock).toHaveBeenLastCalledWith(arg);
```

### React Testing Library Matchers

```typescript
// Presence
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// Visibility
expect(element).toBeVisible();
expect(element).not.toBeVisible();

// Enabled/Disabled
expect(button).toBeEnabled();
expect(button).toBeDisabled();

// Form values
expect(input).toHaveValue('text');
expect(checkbox).toBeChecked();
expect(select).toHaveValue('option1');

// Attributes
expect(element).toHaveAttribute('href', '/home');
expect(element).toHaveClass('active');

// Text content
expect(element).toHaveTextContent('Hello');
expect(element).not.toBeEmptyDOMElement();
```

## Performance Testing

```typescript
it('should complete operation within time limit', () => {
  const start = performance.now();

  performOperation();

  const duration = performance.now() - start;
  expect(duration).toBeLessThan(100); // milliseconds
});
```

## Snapshot Testing

```typescript
// Use sparingly - prefer specific assertions
it('should match snapshot', () => {
  const { container } = render(<Component />);
  expect(container).toMatchSnapshot();
});

// Better: Test specific values
it('should render correctly', () => {
  render(<Component name="John" age={30} />);

  expect(screen.getByText('John')).toBeInTheDocument();
  expect(screen.getByText('30')).toBeInTheDocument();
});
```

## Test Data

### Factories

```typescript
// Create test data factories
function createUser(overrides?: Partial<User>): User {
  return {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
    ...overrides,
  };
}

// Usage
const user = createUser({ name: 'John Doe' });
```

### Fixtures

```typescript
// tests/fixtures/users.ts
export const testUsers = {
  admin: {
    id: '1',
    name: 'Admin User',
    role: 'admin',
  },
  regular: {
    id: '2',
    name: 'Regular User',
    role: 'user',
  },
};
```

## Critical Rules

- ⚠️ **ALWAYS** clear mocks in beforeEach
- ⚠️ **ALWAYS** wait for async operations with waitFor/findBy
- ⚠️ **NEVER** test implementation details
- ⚠️ **ALWAYS** use accessible queries (getByRole)
- ⚠️ **ALWAYS** clean up (timers, subscriptions, etc.)
- ⚠️ **PREFER** user-centric tests (how users interact)
- ⚠️ **AVOID** testing third-party code
- ⚠️ **ALWAYS** test error conditions
- ⚠️ **ALWAYS** test edge cases

## Test Independence

```typescript
// ❌ BAD: Tests depend on execution order
let user: User;

it('should create user', () => {
  user = createUser(); // Shared state!
});

it('should update user', () => {
  updateUser(user); // Depends on previous test!
});

// ✅ GOOD: Each test is independent
it('should create user', () => {
  const user = createUser();
  expect(user).toBeDefined();
});

it('should update user', () => {
  const user = createUser(); // Create fresh data
  const updated = updateUser(user);
  expect(updated).not.toBe(user);
});
```

---

Remember: Good tests give you confidence to refactor and catch bugs early. Write tests that would help future you understand the code.

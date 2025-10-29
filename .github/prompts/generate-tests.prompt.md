---
mode: agent
model: GPT-5
description: Generate comprehensive test suite with October 2025 best practices
---

# Generate Tests Workflow (October 2025)

Generate comprehensive tests for **${input:targetCode:What code to test?}** with ${input:coverageGoal:Coverage goal (80-100)}% coverage.

**October 2025 Testing Standards:**
- TDD approach (write tests that define behavior)
- Chain-of-Thought test planning
- Property-based testing for critical logic
- Integration with Jest + React Testing Library
- Accessibility testing included
- >80% coverage required (see testing.instructions.md)

## Test Requirements

- **Target**: ${input:targetCode}
- **Test Type**: ${input:testType:unit/integration/e2e}
- **Coverage Goal**: ${input:coverageGoal}%
- **Test Framework**: Jest + React Testing Library + Testing Library User Events

## Process (Chain-of-Thought Test Planning)

### Step 0: Think Through Testing Strategy

**Understanding Phase:**
1. What is this code trying to do?
2. What are the inputs and outputs?
3. What are the critical paths?
4. What could go wrong?

**Planning Phase:**
5. What test types do we need? (unit/integration/e2e)
6. What are the edge cases?
7. What are the error scenarios?
8. What should we mock vs. test for real?

### Step 1: Analyze Code

1. **Read the code to test**
   ```
   Use file tool to read: ${input:filePath:Path to file to test}
   ```

2. **Identify testable units**
   - Public functions/methods
   - React components (user interactions, rendering, props)
   - API endpoints (status codes, validation, errors)
   - Business logic (calculations, transformations)
   - Hooks (state management, side effects)

3. **List test scenarios** (Comprehensive)
   - **Happy path**: Normal use cases
   - **Edge cases**: Boundary values (0, -1, max, empty, null)
   - **Error conditions**: Invalid input, network failures, auth errors
   - **Integration points**: External dependencies, API calls
   - **Accessibility**: Screen reader support, keyboard navigation
   - **Performance**: Large datasets, slow responses

### Step 2: Set Up Test File

```typescript
// {testFilePath}
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { {targetName} } from './{fileName}';

// Mock dependencies
jest.mock('@/lib/api', () => ({
  fetchData: jest.fn(),
}));

describe('{targetName}', () => {
  // Setup and teardown
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Tests go here
});
```

### Step 3: Write Tests

#### For Functions/Business Logic

```typescript
describe('calculateTotal', () => {
  it('should calculate total for valid items', () => {
    // Arrange
    const items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 }
    ];

    // Act
    const result = calculateTotal(items);

    // Assert
    expect(result).toBe(35);
  });

  it('should return 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('should handle decimal prices correctly', () => {
    const items = [{ price: 10.99, quantity: 2 }];
    expect(calculateTotal(items)).toBe(21.98);
  });

  it('should throw error for negative prices', () => {
    const items = [{ price: -10, quantity: 1 }];
    expect(() => calculateTotal(items)).toThrow('Price cannot be negative');
  });

  it('should throw error for negative quantities', () => {
    const items = [{ price: 10, quantity: -1 }];
    expect(() => calculateTotal(items)).toThrow('Quantity cannot be negative');
  });
});
```

#### For React Components

```typescript
describe('UserProfile Component', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://example.com/avatar.jpg'
  };

  it('should render user information', () => {
    render(<UserProfile user={mockUser} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByAltText('Profile picture')).toHaveAttribute('src', mockUser.avatar);
  });

  it('should render loading state', () => {
    render(<UserProfile user={null} loading={true} />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('should render error state', () => {
    render(<UserProfile user={null} error="Failed to load user" />);

    expect(screen.getByText('Failed to load user')).toBeInTheDocument();
  });

  it('should handle edit button click', async () => {
    const onEdit = jest.fn();
    render(<UserProfile user={mockUser} onEdit={onEdit} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockUser);
  });

  it('should be accessible', () => {
    const { container } = render(<UserProfile user={mockUser} />);

    // Check for proper heading hierarchy
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();

    // Check for alt text on images
    expect(screen.getByAltText('Profile picture')).toBeInTheDocument();
  });
});
```

#### For API Routes/Endpoints

```typescript
describe('POST /api/users', () => {
  beforeEach(() => {
    // Clear database or use test database
  });

  it('should create user with valid data', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'SecurePass123!'
    };

    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.email).toBe(userData.email);
    expect(response.body.data).not.toHaveProperty('password');
  });

  it('should return 400 for invalid email', async () => {
    const userData = {
      email: 'invalid-email',
      name: 'Test User',
      password: 'SecurePass123!'
    };

    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('email');
  });

  it('should return 409 for duplicate email', async () => {
    const userData = {
      email: 'existing@example.com',
      name: 'Test User',
      password: 'SecurePass123!'
    };

    // Create user first time
    await request(app).post('/api/users').send(userData);

    // Try to create again
    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(409);

    expect(response.body.error).toContain('already exists');
  });

  it('should hash password before storing', async () => {
    const userData = {
      email: 'test2@example.com',
      name: 'Test User',
      password: 'SecurePass123!'
    };

    await request(app).post('/api/users').send(userData);

    const user = await db.user.findUnique({ where: { email: userData.email } });
    expect(user.password).not.toBe(userData.password);
    expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash pattern
  });

  it('should require authentication for protected endpoints', async () => {
    await request(app)
      .get('/api/users/me')
      .expect(401);
  });
});
```

#### For Async Operations

```typescript
describe('fetchUserData', () => {
  it('should fetch and return user data', async () => {
    const mockUser = { id: '1', name: 'John' };
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockUser
    });
    global.fetch = mockFetch;

    const result = await fetchUserData('1');

    expect(mockFetch).toHaveBeenCalledWith('/api/users/1');
    expect(result).toEqual(mockUser);
  });

  it('should throw error on failed fetch', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });
    global.fetch = mockFetch;

    await expect(fetchUserData('999')).rejects.toThrow('Not Found');
  });

  it('should handle network errors', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockFetch;

    await expect(fetchUserData('1')).rejects.toThrow('Network error');
  });

  it('should retry on failure', async () => {
    const mockFetch = jest.fn()
      .mockRejectedValueOnce(new Error('Temporary error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', name: 'John' })
      });
    global.fetch = mockFetch;

    const result = await fetchUserDataWithRetry('1');

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ id: '1', name: 'John' });
  });
});
```

### Step 4: Test Edge Cases

```typescript
describe('Edge Cases', () => {
  it('should handle null input', () => {
    expect(processData(null)).toEqual([]);
  });

  it('should handle undefined input', () => {
    expect(processData(undefined)).toEqual([]);
  });

  it('should handle empty string', () => {
    expect(processData('')).toEqual([]);
  });

  it('should handle very large numbers', () => {
    expect(calculate(Number.MAX_SAFE_INTEGER)).toBeLessThan(Infinity);
  });

  it('should handle special characters in input', () => {
    const input = '<script>alert("xss")</script>';
    expect(sanitizeInput(input)).not.toContain('<script>');
  });
});
```

### Step 5: Test Error Handling

```typescript
describe('Error Handling', () => {
  it('should catch and handle errors gracefully', async () => {
    const failingOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));

    await expect(safeOperation(failingOperation)).resolves.not.toThrow();
  });

  it('should log errors appropriately', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Test error');

    await operationWithLogging().catch(() => {});

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test error'));
    consoleSpy.mockRestore();
  });
});
```

### Step 6: Run Tests and Check Coverage

```bash
# Run tests
npm test -- {testFile}

# Run with coverage
npm test -- {testFile} --coverage

# Run all tests
npm test

# Watch mode for development
npm test -- --watch
```

## Test Organization

```typescript
describe('FeatureName', () => {
  describe('SubFeature1', () => {
    it('should handle scenario 1', () => {});
    it('should handle scenario 2', () => {});
  });

  describe('SubFeature2', () => {
    it('should handle scenario 1', () => {});
    it('should handle scenario 2', () => {});
  });

  describe('Error Handling', () => {
    it('should handle error 1', () => {});
    it('should handle error 2', () => {});
  });

  describe('Edge Cases', () => {
    it('should handle edge case 1', () => {});
    it('should handle edge case 2', () => {});
  });
});
```

## Coverage Goals

- **Statements**: ≥ {coverageGoal}%
- **Branches**: ≥ {coverageGoal}%
- **Functions**: ≥ {coverageGoal}%
- **Lines**: ≥ {coverageGoal}%

## Test Quality Checklist

- [ ] Tests are independent (no shared state)
- [ ] Tests are deterministic (same result every time)
- [ ] Tests are fast (< 100ms per test)
- [ ] Tests follow AAA pattern (Arrange, Act, Assert)
- [ ] Test names clearly describe what is tested
- [ ] Each test tests one thing
- [ ] Edge cases are covered
- [ ] Error conditions are tested
- [ ] Mocks are used appropriately
- [ ] Tests don't test implementation details
- [ ] Coverage goals are met

---

**Variables to fill**:
- `{targetCode}`: What to test (e.g., "UserService", "LoginForm component")
- `{testType}`: Type of tests (e.g., "unit", "integration", "e2e")
- `{coverageGoal}`: Coverage target (e.g., "80", "90", "100")
- `{filePath}`: Path to code being tested
- `{testFilePath}`: Path to test file

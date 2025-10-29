---
mode: agent
model: Claude Sonnet 4.5
description: Refactor code while preserving functionality with comprehensive testing (October 2025)
---

# Refactoring Workflow (October 2025 Best Practices)

Refactor **${input:targetCode:What code to refactor?}** to improve ${input:improvementGoal:What to improve? (readability/performance/maintainability)} while maintaining all existing functionality.

**October 2025 Refactoring Standards:**
- Use Chain-of-Thought analysis before changes
- Test-driven refactoring (tests must pass continuously)
- Incremental changes with validation after each step
- Use `search/codebase` to find all usages
- Leverage `usages` tool for impact analysis
- Apply behavior-preserving transformations only

**Why Claude Sonnet 4.5:**
- Superior at careful, incremental changes
- Excellent at preserving behavior
- Strong at analyzing code relationships

## Refactoring Goals

- **Primary Goal**: ${input:improvementGoal}
- **Constraints**: ${input:constraints:Any constraints? (API compatibility, performance, etc.)}
- **Must Preserve**: All existing functionality, public APIs, and test coverage

## Process (Chain-of-Thought Refactoring)

### Step 0: Think Through the Refactoring

**Analysis Questions:**
1. **What**: What exactly needs to be improved?
2. **Why**: Why is the current implementation problematic?
3. **How**: How can we improve it without breaking things?
4. **Risk**: What could go wrong? What's the impact?
5. **Validate**: How will we verify it still works?

### Step 1: Analyze Current Implementation

1. **Read the target code**
   ```
   Use file tool to read: ${input:filePath:Path to file to refactor}
   ```

2. **Find all usages** (Critical for Impact Analysis)
   ```
   Use usages tool to find where this code is called
   This prevents breaking changes!
   ```

3. **Understand dependencies**
   ```
   Use search/codebase to find related code patterns
   ```

4. **Document current behavior** (Behavior Preservation)
   - What does it do? (functionality)
   - What are the inputs/outputs? (interface)
   - What are the edge cases? (scenarios)
   - What tests exist? (coverage)
   - What are the performance characteristics? (benchmarks)

### Step 2: Create Safety Net

Before refactoring, ensure comprehensive test coverage:

```typescript
// Add tests for current behavior if missing
describe('Current Behavior Tests', () => {
  it('should handle scenario 1', () => {
    // Test current behavior
  });

  it('should handle edge case 1', () => {
    // Test edge cases
  });

  // Add more tests to cover all paths
});
```

Run tests to establish baseline:
```bash
npm test -- {testFile}
```

### Step 3: Plan Refactoring

Create incremental refactoring plan:

1. **Phase 1**: Internal improvements (no API changes)
   - Extract functions
   - Rename variables
   - Simplify logic
   - Add types

2. **Phase 2**: Structural improvements
   - Move code to better locations
   - Split large functions
   - Remove duplication
   - Optimize algorithms

3. **Phase 3**: API improvements (if needed)
   - Deprecate old API
   - Introduce new API
   - Migration guide
   - Dual support period

### Step 4: Refactor Incrementally

For each change:

1. **Make one small change**
2. **Run tests** - ensure they still pass
3. **Commit** - with descriptive message
4. **Continue** - move to next change

#### Example Refactoring Patterns

**Extract Function**:
```typescript
// Before
function processOrder(order) {
  // 50 lines of code
  const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = total * 0.1;
  const shipping = total > 100 ? 0 : 10;
  // More complex logic...
}

// After
function processOrder(order) {
  const subtotal = calculateSubtotal(order.items);
  const tax = calculateTax(subtotal);
  const shipping = calculateShipping(subtotal);
  return buildOrderSummary(subtotal, tax, shipping);
}

function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function calculateTax(subtotal: number): number {
  return subtotal * TAX_RATE;
}

function calculateShipping(subtotal: number): number {
  return subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}
```

**Simplify Conditionals**:
```typescript
// Before
if (user.role === 'admin' || user.role === 'moderator' || user.role === 'superuser') {
  // Allow access
}

// After
const PRIVILEGED_ROLES = ['admin', 'moderator', 'superuser'];

if (PRIVILEGED_ROLES.includes(user.role)) {
  // Allow access
}

// Even better
function hasPrivilegedRole(user: User): boolean {
  const PRIVILEGED_ROLES = ['admin', 'moderator', 'superuser'];
  return PRIVILEGED_ROLES.includes(user.role);
}

if (hasPrivilegedRole(user)) {
  // Allow access
}
```

**Remove Duplication**:
```typescript
// Before
function getActiveUsers() {
  return users.filter(u => u.status === 'active' && !u.deleted && u.verified);
}

function getActivePremiumUsers() {
  return users.filter(u => u.status === 'active' && !u.deleted && u.verified && u.premium);
}

// After
function isActiveUser(user: User): boolean {
  return user.status === 'active' && !user.deleted && user.verified;
}

function getActiveUsers(): User[] {
  return users.filter(isActiveUser);
}

function getActivePremiumUsers(): User[] {
  return users.filter(u => isActiveUser(u) && u.premium);
}
```

**Improve Types**:
```typescript
// Before
function updateUser(id: string, data: any) {
  // Implementation
}

// After
interface UserUpdateData {
  name?: string;
  email?: string;
  role?: UserRole;
}

function updateUser(id: string, data: UserUpdateData): Promise<User> {
  // Implementation with type safety
}
```

### Step 5: Verify Refactoring

After each phase:

1. **Run all tests**
   ```bash
   npm test
   ```

2. **Check TypeScript**
   ```bash
   npm run type-check
   ```

3. **Run linter**
   ```bash
   npm run lint
   ```

4. **Manual testing**
   - Test in development environment
   - Verify edge cases
   - Check performance if relevant

### Step 6: Update Documentation

- [ ] Update code comments if behavior explanations changed
- [ ] Update function documentation (JSDoc)
- [ ] Update README if public API changed
- [ ] Add migration guide if breaking changes

## Refactoring Checklist

### Before Starting
- [ ] All existing tests are passing
- [ ] Test coverage is adequate (>80%)
- [ ] I understand the current implementation
- [ ] I've identified all usages of this code
- [ ] I have a clear refactoring goal

### During Refactoring
- [ ] Making small, incremental changes
- [ ] Running tests after each change
- [ ] Committing logical units
- [ ] Not changing behavior (only structure)
- [ ] Preserving all public APIs

### After Refactoring
- [ ] All tests still passing
- [ ] No TypeScript errors
- [ ] Code is more readable
- [ ] Performance is same or better
- [ ] Documentation is updated
- [ ] No new linter warnings

## Common Refactoring Patterns

### 1. Extract Method
**When**: Function is too long or does multiple things
**How**: Extract logical chunks into separate functions

### 2. Inline Method
**When**: Method body is as clear as its name
**How**: Replace calls with method body

### 3. Extract Variable
**When**: Complex expression is hard to understand
**How**: Put expression result in well-named variable

### 4. Inline Temp
**When**: Temp variable is used only once
**How**: Replace variable with expression

### 5. Replace Temp with Query
**When**: Temp variable holds result of expression
**How**: Extract expression into method

### 6. Split Temporary Variable
**When**: Temp variable is assigned multiple times
**How**: Create separate variable for each assignment

### 7. Remove Assignments to Parameters
**When**: Code assigns to parameter
**How**: Use temp variable instead

### 8. Replace Method with Method Object
**When**: Long method uses local variables heavily
**How**: Turn method into separate class

### 9. Substitute Algorithm
**When**: Algorithm can be clearer
**How**: Replace with clearer algorithm

## Anti-Patterns to Avoid

❌ **Don't**:
- Refactor without tests
- Change behavior while refactoring
- Make multiple changes at once
- Skip test runs between changes
- Refactor and add features simultaneously

✅ **Do**:
- Test before, during, and after
- Make tiny incremental changes
- Commit frequently
- Keep behavior exactly the same
- Refactor first, then add features

## Performance Considerations

If refactoring for performance:

1. **Measure first**
   ```typescript
   console.time('operation');
   // Code to measure
   console.timeEnd('operation');
   ```

2. **Make change**

3. **Measure again**

4. **Compare results**

Only keep changes that show measurable improvement.

---

**Variables to fill**:
- `{targetCode}`: What code to refactor (e.g., "UserService class")
- `{improvementGoal}`: What to improve (e.g., "readability", "performance", "testability")
- `{filePath}`: Path to file containing code
- `{constraints}`: Any constraints (e.g., "maintain backwards compatibility")

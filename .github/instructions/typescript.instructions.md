---
applyTo: "**/*.{ts,tsx}"
description: TypeScript-specific coding guidelines and best practices (October 2025)
---

# TypeScript Instructions (October 2025)

When working with TypeScript files, follow these strict guidelines.

**October 2025 TypeScript Standards:**
- TypeScript 5.2+ with strict mode enabled
- Explicit types on all function signatures
- No `any` - use `unknown` and type guards
- Prefer `interface` for objects, `type` for unions
- Readonly by default for immutability

**Auto-Applied To:** All `.ts` and `.tsx` files

## Type Safety

### Explicit Types Required

```typescript
// ✅ DO: Explicit return types
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ DON'T: Implicit return types
function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### No 'any' Type

```typescript
// ❌ NEVER use 'any'
function processData(data: any) {}

// ✅ Use 'unknown' and narrow
function processData(data: unknown) {
  if (typeof data === 'string') {
    // data is string here
  }
}

// ✅ Or proper types
interface RequestData {
  id: string;
  payload: Record<string, unknown>;
}

function processData(data: RequestData) {}
```

### Strict Null Checks

```typescript
// ✅ Handle null/undefined explicitly
function getUser(id: string): User | null {
  const user = database.find(id);
  return user ?? null;
}

// ✅ Use optional chaining
const userName = user?.profile?.name ?? 'Anonymous';

// ✅ Non-null assertion only when certain
const element = document.getElementById('root')!;
```

## Type Definitions

### Interface vs Type

```typescript
// ✅ Use interface for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Use type for unions, intersections, primitives
type Status = 'pending' | 'approved' | 'rejected';
type ID = string | number;
type UserWithTimestamps = User & Timestamps;
```

### Readonly Properties

```typescript
// ✅ Use readonly for immutable data
interface Config {
  readonly apiUrl: string;
  readonly timeout: number;
}

// ✅ Use const assertions for literal types
const ROUTES = {
  home: '/',
  about: '/about',
  contact: '/contact',
} as const;
```

## Generics

```typescript
// ✅ Use generics for reusable, type-safe code
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

// ✅ Constrain generics when needed
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// ✅ Generic components
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <>{items.map(renderItem)}</>;
}
```

## Type Guards

```typescript
// ✅ Create type guards for runtime checks
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}

// Usage
if (isUser(data)) {
  // data is User here
  console.log(data.name);
}
```

## Utility Types

```typescript
// ✅ Use built-in utility types

// Partial - all properties optional
type PartialUser = Partial<User>;

// Required - all properties required
type RequiredUser = Required<Partial<User>>;

// Pick - select specific properties
type UserSummary = Pick<User, 'id' | 'name'>;

// Omit - exclude specific properties
type UserWithoutPassword = Omit<User, 'password'>;

// Record - object with specific key/value types
type UserMap = Record<string, User>;

// ReturnType - extract function return type
type FetchResult = ReturnType<typeof fetchData>;

// Parameters - extract function parameter types
type FetchParams = Parameters<typeof fetchData>;
```

## Async/Await

```typescript
// ✅ Always type async function returns
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
}

// ✅ Handle errors with proper typing
async function safeOperation(): Promise<Result<Data, Error>> {
  try {
    const data = await riskyOperation();
    return { success: true, data };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error };
    }
    return { success: false, error: new Error('Unknown error') };
  }
}
```

## Enums vs Union Types

```typescript
// ❌ Avoid enums (generate extra code)
enum Status {
  Pending,
  Approved,
  Rejected
}

// ✅ Use union types instead
type Status = 'pending' | 'approved' | 'rejected';

// ✅ Or const objects with 'as const'
const Status = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
} as const;

type Status = typeof Status[keyof typeof Status];
```

## Import/Export

```typescript
// ✅ Export types with type keyword
export type { User, UserRole };

// ✅ Import types with type keyword
import type { User } from './types';

// ✅ Mixed imports
import { api } from './api';
import type { ApiResponse } from './api';
```

## Common Patterns

### Result Type

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

function divide(a: number, b: number): Result<number> {
  if (b === 0) {
    return { success: false, error: new Error('Division by zero') };
  }
  return { success: true, data: a / b };
}
```

### Branded Types

```typescript
// Create distinct types from primitives
type UserId = string & { readonly brand: unique symbol };
type Email = string & { readonly brand: unique symbol };

function createUserId(id: string): UserId {
  // Validation logic
  return id as UserId;
}

// Now can't accidentally mix up string types
function getUser(id: UserId) {}

getUser('123'); // Error: string is not UserId
getUser(createUserId('123')); // OK
```

### Discriminated Unions

```typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number }
  | { kind: 'rectangle'; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'square':
      return shape.size ** 2;
    case 'rectangle':
      return shape.width * shape.height;
  }
}
```

## tsconfig.json Requirements

Ensure strict mode is enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Error Handling

```typescript
// ✅ Create custom error types
class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ✅ Use error boundaries in React
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }
}
```

## Critical Rules

- ⚠️ **ALWAYS** enable strict mode in tsconfig.json
- ⚠️ **NEVER** use `any` type (use `unknown` instead)
- ⚠️ **ALWAYS** provide explicit return types for functions
- ⚠️ **ALWAYS** handle null/undefined cases
- ⚠️ **PREFER** interfaces for object shapes
- ⚠️ **PREFER** type for unions and intersections
- ⚠️ **ALWAYS** use const assertions for constant objects
- ⚠️ **AVOID** enums (use union types)
- ⚠️ **ALWAYS** type async function returns as Promise<T>

---

These rules ensure type safety, catch errors at compile time, and improve code maintainability.

---
applyTo: "**/*.{jsx,tsx}"
description: React-specific coding guidelines and patterns (October 2025)
---

# React Instructions (October 2025)

When working with React components, follow these guidelines.

**October 2025 React Standards:**
- React 18+ with concurrent features
- Server Components by default (Next.js App Router)
- Client Components: explicit "use client" directive
- Functional components only (no class components)
- Custom hooks for complex logic
- Accessibility built-in (WCAG 2.1 AA)

**Auto-Applied To:** All `.jsx` and `.tsx` files

## Component Structure

### Functional Components Only

```typescript
// ✅ DO: Functional component with TypeScript
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Component logic...

  return (
    <div>
      {/* JSX */}
    </div>
  );
};

// ❌ DON'T: Class components
class UserProfile extends React.Component {}
```

### Props Interface First

```typescript
// ✅ Props interface before component
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  children
}) => {
  // Component implementation
};
```

## Hooks

### useState

```typescript
// ✅ Type state explicitly
const [count, setCount] = useState<number>(0);
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<Item[]>([]);

// ✅ Functional updates for derived state
setCount(prev => prev + 1);
setItems(prev => [...prev, newItem]);
```

### useEffect

```typescript
// ✅ Dependency array is required
useEffect(() => {
  fetchData();
}, [dependency]); // Always include

// ✅ Cleanup functions
useEffect(() => {
  const subscription = subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);

// ✅ Separate effects for different concerns
useEffect(() => {
  // Handle user data
}, [userId]);

useEffect(() => {
  // Handle analytics
}, [page]);
```

### Custom Hooks

```typescript
// ✅ Extract logic into custom hooks
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      try {
        setLoading(true);
        const data = await api.fetchUser(userId);
        if (!cancelled) {
          setUser(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { user, loading, error };
}

// Usage
function UserProfile({ userId }: Props) {
  const { user, loading, error } = useUser(userId);

  // Render logic
}
```

### useMemo and useCallback

```typescript
// ✅ useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return items.reduce((sum, item) => sum + item.value, 0);
}, [items]);

// ✅ useCallback for stable function references
const handleClick = useCallback(() => {
  onItemClick(itemId);
}, [itemId, onItemClick]);

// ❌ Don't overuse - only when needed for performance
const simpleValue = useMemo(() => count * 2, [count]); // Overkill
```

### useRef

```typescript
// ✅ DOM references
const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  inputRef.current?.focus();
}, []);

// ✅ Mutable values that don't cause re-renders
const timerRef = useRef<NodeJS.Timeout>();

useEffect(() => {
  timerRef.current = setTimeout(() => {}, 1000);

  return () => clearTimeout(timerRef.current);
}, []);
```

## Component Patterns

### Conditional Rendering

```typescript
// ✅ Early returns for loading/error states
if (loading) {
  return <Spinner />;
}

if (error) {
  return <ErrorMessage error={error} />;
}

// ✅ Logical AND for optional elements
{isAdmin && <AdminPanel />}

// ✅ Ternary for either/or
{user ? <UserProfile user={user} /> : <LoginPrompt />}

// ❌ Don't nest ternaries
{condition ? (other ? <A /> : <B />) : <C />} // Hard to read
```

### List Rendering

```typescript
// ✅ Always use key prop
{items.map(item => (
  <Item key={item.id} {...item} />
))}

// ✅ Use index only for static lists
{labels.map((label, index) => (
  <Label key={index}>{label}</Label>
))}

// ❌ Never use index for dynamic lists
{items.map((item, index) => (
  <Item key={index} {...item} /> // Can cause bugs!
))}
```

### Composition

```typescript
// ✅ Use children prop for composition
interface CardProps {
  title: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children }) => (
  <div className="card">
    <h2>{title}</h2>
    <div className="card-content">
      {children}
    </div>
  </div>
);

// Usage
<Card title="User Info">
  <UserProfile />
  <UserStats />
</Card>

// ✅ Render props for flexible composition
interface DataLoaderProps<T> {
  url: string;
  children: (data: T, loading: boolean, error: Error | null) => React.ReactNode;
}

function DataLoader<T>({ url, children }: DataLoaderProps<T>) {
  const { data, loading, error } = useFetch<T>(url);
  return <>{children(data, loading, error)}</>;
}

// Usage
<DataLoader<User> url="/api/user">
  {(user, loading, error) => {
    if (loading) return <Spinner />;
    if (error) return <Error error={error} />;
    return <UserProfile user={user} />;
  }}
</DataLoader>
```

## Error Handling

### Error Boundaries

```typescript
// ✅ Create error boundary component
interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

## Performance

### React.memo

```typescript
// ✅ Memoize expensive components
interface ItemProps {
  item: Item;
  onSelect: (id: string) => void;
}

export const Item = React.memo<ItemProps>(({ item, onSelect }) => {
  return (
    <div onClick={() => onSelect(item.id)}>
      {item.name}
    </div>
  );
});

// ✅ Custom comparison function if needed
export const Item = React.memo(
  ItemComponent,
  (prevProps, nextProps) => {
    return prevProps.item.id === nextProps.item.id;
  }
);
```

### Code Splitting

```typescript
// ✅ Lazy load routes and heavy components
const Dashboard = React.lazy(() => import('./Dashboard'));
const Settings = React.lazy(() => import('./Settings'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

## Accessibility

### Semantic HTML

```typescript
// ✅ Use semantic elements
<nav>
  <ul>
    <li><a href="/home">Home</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>Title</h1>
    <p>Content</p>
  </article>
</main>

// ❌ Avoid div soup
<div className="nav">
  <div className="list">
    <div className="item">
      <div className="link">Home</div>
    </div>
  </div>
</div>
```

### ARIA Attributes

```typescript
// ✅ Add ARIA labels for screen readers
<button
  aria-label="Close dialog"
  onClick={onClose}
>
  <CloseIcon />
</button>

<input
  type="text"
  aria-label="Search"
  aria-describedby="search-help"
/>
<p id="search-help">Enter keywords to search</p>

// ✅ Use aria-live for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

### Keyboard Navigation

```typescript
// ✅ Handle keyboard events
function Dialog({ onClose }: Props) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return <div role="dialog" aria-modal="true">{/* ... */}</div>;
}
```

## Forms

### Controlled Components

```typescript
// ✅ Controlled form with validation
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit form
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <span id="email-error" role="alert">
            {errors.email}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <span id="password-error" role="alert">
            {errors.password}
          </span>
        )}
      </div>

      <button type="submit">Login</button>
    </form>
  );
}
```

## Critical Rules

- ⚠️ **ALWAYS** use functional components
- ⚠️ **ALWAYS** define props interface before component
- ⚠️ **ALWAYS** include dependency arrays in useEffect
- ⚠️ **ALWAYS** provide cleanup functions in useEffect
- ⚠️ **ALWAYS** use key prop when rendering lists
- ⚠️ **ALWAYS** handle loading and error states
- ⚠️ **PREFER** custom hooks for complex logic
- ⚠️ **PREFER** composition over prop drilling
- ⚠️ **AVOID** inline function definitions in JSX
- ⚠️ **AVOID** mutating state directly
- ⚠️ **ALWAYS** use semantic HTML
- ⚠️ **ALWAYS** add ARIA labels for icon buttons
- ⚠️ **ALWAYS** support keyboard navigation

---

These patterns ensure maintainable, performant, and accessible React applications.

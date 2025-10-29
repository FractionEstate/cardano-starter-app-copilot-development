---
mode: agent
model: GPT-5
description: Create a new React component with TypeScript, tests, and Storybook story (October 2025)
---

# Create Component Workflow (October 2025)

Create a new **${input:componentName:Component name (PascalCase)}** component following project conventions.

**October 2025 Component Standards:**
- Server Components by default (Next.js App Router)
- Client Components: "use client" directive when needed
- TypeScript strict mode with explicit types
- Accessibility built-in (WCAG 2.1 AA)
- Test file with comprehensive coverage
- Follow react.instructions.md patterns

**Why GPT-5:**
- Superior code generation quality
- Better at following patterns
- Excellent TypeScript support

## Requirements

1. **Component Specification**
   - Name: ${input:componentName}
   - Type: ${input:componentType:server or client?}
   - Location: ${input:location:common/features/layout?}
   - Purpose: ${input:purpose:What does this component do?}

## Implementation Steps (Pattern-Following Workflow)

### Step 0: Research Existing Patterns

**Use Chain-of-Thought:**
1. What similar components exist?
2. What patterns do they follow?
3. What should I reuse vs. create new?

```
Use search/codebase to find:
- Similar component names
- Components in same feature area
- Reusable utilities or hooks
```

### Step 2: Create Component File
Location: `src/components/{folder}/{componentName}.tsx`

```typescript
import React from 'react';

export interface {componentName}Props {
  // Define props with TypeScript
}

/**
 * {Brief description of component purpose}
 *
 * @example
 * ```tsx
 * <{componentName} prop="value" />
 * ```
 */
export const {componentName}: React.FC<{componentName}Props> = (props) => {
  // Implementation

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

### Step 3: Create Test File
Location: `src/components/{folder}/{componentName}.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { {componentName} } from './{componentName}';

describe('{componentName}', () => {
  it('should render without crashing', () => {
    render(<{componentName} />);
    expect(screen.getByRole('...')).toBeInTheDocument();
  });

  it('should handle user interactions', () => {
    // Test user interactions
  });

  it('should render correctly with different props', () => {
    // Test prop variations
  });
});
```

### Step 4: Create Storybook Story (if UI component)
Location: `src/components/{folder}/{componentName}.stories.tsx`

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { {componentName} } from './{componentName}';

const meta: Meta<typeof {componentName}> = {
  title: 'Components/{folder}/{componentName}',
  component: {componentName},
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof {componentName}>;

export const Default: Story = {
  args: {
    // Default props
  },
};

export const WithVariant: Story = {
  args: {
    // Variant props
  },
};
```

### Step 5: Export from Index
Add to `src/components/index.ts`:

```typescript
export { {componentName} } from './{folder}/{componentName}';
export type { {componentName}Props } from './{folder}/{componentName}';
```

## Quality Checks

- [ ] TypeScript types defined for all props
- [ ] Component renders without errors
- [ ] Tests pass with >80% coverage
- [ ] Accessibility: semantic HTML, ARIA labels
- [ ] Responsive design implemented
- [ ] Error boundaries if needed
- [ ] Loading states if async
- [ ] Storybook story created

## Usage Example

After creation, document usage:

```typescript
import { {componentName} } from '@/components';

function Page() {
  return (
    <{componentName}
      prop1="value"
      prop2={variable}
      onEvent={handler}
    />
  );
}
```

---

**Variables to fill**:
- `{componentName}`: Name of component (e.g., "UserProfile")
- `{componentType}`: Type (e.g., "functional", "page", "layout")
- `{folder}`: Folder location (e.g., "common", "features/auth")
- `{propsList}`: List of props needed
- `{featuresList}`: Key features to implement

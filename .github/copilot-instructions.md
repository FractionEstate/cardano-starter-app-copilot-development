# GitHub Copilot Instructions

> Auto-applied instructions for GitHub Copilot in this workspace
> Loaded automatically - no need to reference manually

## Quick Context

This is a fullstack TypeScript project. Always:
- Use TypeScript with strict types
- Follow TDD (write tests first)
- Implement proper error handling
- Validate all user inputs
- Check `AGENTS.md` for detailed guidelines

## Code Generation Defaults

### TypeScript
- Explicit return types on all functions
- Interface over type for object shapes
- Readonly where appropriate
- Avoid `any` - use `unknown` or proper types

### React Components
- Functional components only
- Props interface before component
- Custom hooks for complex logic
- Error boundaries for error handling

### API Routes
- Async/await (no raw promises)
- Try-catch with proper error responses
- Input validation with Zod or similar
- Rate limiting on public endpoints

### Database Operations
- Use Prisma client methods
- Transactions for multi-step operations
- Proper error handling and logging
- Index hints for complex queries

## Common Patterns

### Authentication Check
```typescript
const session = await getServerSession(authOptions);
if (!session) {
  return new Response('Unauthorized', { status: 401 });
}
```

### API Response Format
```typescript
// Success
return Response.json({
  data: result,
  success: true
});

// Error
return Response.json({
  error: 'Message',
  success: false
}, { status: 400 });
```

### Async Error Handling
```typescript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', { error });
  throw new AppError('User-friendly message', { cause: error });
}
```

## Tool Usage

When you need to:
- **Find similar code**: Use `search/codebase` tool
- **Read files**: Use `file` tool with specific line ranges
- **Check implementations**: Use `usages` tool for symbols
- **Run commands**: Use `terminal` tool (ask first for destructive operations)

## Security Reminders

🚨 **Never generate**:
- Hardcoded secrets or API keys
- SQL with string concatenation
- Unvalidated user input in queries
- Authentication bypasses for "testing"

✅ **Always include**:
- Input validation
- Authorization checks
- Error handling
- Type safety

## Quick Commands

- `/tests` - Generate comprehensive tests
- `/fix` - Analyze and fix issues
- `/explain` - Explain complex code
- `/doc` - Generate documentation

## Context Priority

When generating code, prioritize these sources:
1. Existing implementations in same folder
2. Type definitions in `types/` folder
3. Patterns in `AGENTS.md`
4. Similar code from `search/codebase`

---

*For custom workflows, see `.github/prompts/*.prompt.md`*
*For chat modes, see `.github/chatmodes/*.chatmode.md`*

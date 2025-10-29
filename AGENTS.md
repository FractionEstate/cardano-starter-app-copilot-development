# Project Instructions for AI Agents

> Universal instructions for all AI coding agents (GitHub Copilot, Cursor, Claude, etc.)
> Last Updated: October 29, 2025

## 🎯 Project Overview

This is a **Cardano fullstack starter template** for rapid dApp development with modern best practices and AI-assisted workflows.

### Tech Stack
- **Monorepo**: Turborepo for efficient builds and caching
- **Frontend**: Next.js 14+ with TypeScript and Lucid Evolution
- **Backend**: Dolos (lightweight Cardano node) + Node.js/Express
- **Smart Contracts**: Aiken (in dedicated `aiken/` folder)
- **Database**: PostgreSQL with Prisma ORM (for off-chain data)
- **Testing**: Jest + React Testing Library + Aiken property tests
- **CI/CD**: GitHub Actions with Cardano-specific workflows
- **AI Tools**: GitHub Copilot with Cardano MCP integration

## 📋 Development Principles

### Code Quality Standards
1. **Type Safety First**: Always use TypeScript with strict mode (Aiken for validators)
2. **Test-Driven Development**: Write tests before implementation (including property-based tests for Aiken)
3. **Security by Default**: Validate all inputs, audit smart contracts, sanitize outputs
4. **Performance Conscious**: Optimize UTxO queries, lazy load components, efficient datum design
5. **Accessibility**: Follow WCAG 2.1 AA standards

### Architecture Patterns
- **Monorepo**: Turborepo with packages: `apps/web` (frontend), `apps/api` (backend), `packages/dolos`, `aiken/validators`
- **Frontend**: Component-driven with custom hooks, Lucid Evolution for transactions
- **Backend**: Dolos node + Express API for off-chain logic
- **Smart Contracts**: Aiken validators with proper testing and optimization
- **State Management**: Context API for wallet state, React Query for blockchain data
- **Error Handling**: Centralized error handling for transactions and API calls
- **API Design**: RESTful with Cardano-specific endpoints (UTxO queries, transaction submission)

## 🔧 Coding Conventions

### TypeScript/JavaScript
```typescript
// ✅ DO: Use functional components with TypeScript
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  // Implementation
};

// ✅ DO: Explicit return types for functions
async function fetchUser(id: string): Promise<User> {
  // Implementation
}

// ❌ DON'T: Use 'any' type
// ❌ DON'T: Ignore error handling
```

### File Naming
- **Components**: PascalCase (`UserProfile.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Hooks**: camelCase with 'use' prefix (`useAuth.ts`)
- **Tests**: Same as file + `.test.ts` (`UserProfile.test.tsx`)
- **Types**: PascalCase in `types/` folder (`User.types.ts`)

### Project Structure
```
.
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/           # Next.js 14+ App Router
│   │   │   ├── components/    # React components
│   │   │   │   ├── wallet/   # Wallet connection components
│   │   │   │   ├── tx/       # Transaction builder components
│   │   │   │   └── common/   # Reusable UI components
│   │   │   ├── hooks/         # Custom React hooks (useCardano, useLucid)
│   │   │   ├── lib/           # Lucid Evolution utilities
│   │   │   └── types/         # TypeScript type definitions
│   │   └── package.json
│   └── api/                    # Express backend
│       ├── src/
│       │   ├── routes/        # API routes
│       │   ├── services/      # Business logic (UTxO indexing, etc.)
│       │   ├── middleware/    # Express middleware
│       │   └── lib/           # Blaze SDK utilities
│       └── package.json
├── packages/
│   ├── dolos/                  # Dolos node configuration
│   │   ├── docker-compose.yml
│   │   ├── dolos.toml
│   │   └── README.md
│   ├── contracts/              # Compiled Aiken blueprints (auto-generated)
│   └── shared/                 # Shared types and utilities
├── aiken/                      # Aiken smart contracts
│   ├── validators/
│   │   └── example.ak
│   ├── lib/
│   ├── aiken.toml
│   └── README.md
├── .github/
│   ├── workflows/
│   │   ├── aiken-build.yml    # Build and test Aiken contracts
│   │   ├── frontend-deploy.yml
│   │   └── backend-deploy.yml
│   ├── instructions/          # AI coding guidelines
│   │   ├── cardano.instructions.md
│   │   ├── typescript.instructions.md
│   │   └── testing.instructions.md
│   └── chatmodes/             # Specialized AI modes
│       ├── plan.chatmode.md
│       ├── implement.chatmode.md
│       ├── aiken.chatmode.md
│       ├── cardano-frontend.chatmode.md
│       └── cardano-backend.chatmode.md
├── .vscode/
│   ├── settings.json          # Aiken LSP, TypeScript, formatting
│   ├── extensions.json        # Recommended extensions
│   └── launch.json            # Debug configurations
├── turbo.json                 # Turborepo pipeline config
├── package.json               # Root package.json
└── pnpm-workspace.yaml        # PNPM workspace config
```

## 🚫 Critical Rules

### Security (Cardano-Specific)
- ⚠️ **NEVER** commit wallet mnemonics, private keys, or API keys
- ⚠️ **ALWAYS** validate addresses (Bech32 format) before transactions
- ⚠️ **ALWAYS** validate UTxO existence before spending
- ⚠️ **ALWAYS** audit Aiken validators for common vulnerabilities (double satisfaction, time range manipulation)
- ⚠️ **ALWAYS** test smart contracts with property-based testing
- ⚠️ **ALWAYS** use HTTPS in production
- ⚠️ **ALWAYS** verify datum/redeemer schemas match validator expectations
- ⚠️ **REQUIRE** user confirmation before signing transactions
- ⚠️ **NEVER** trust user input without validation (especially lovelace amounts)

### Database & Blockchain
- ⚠️ **NEVER** delete database tables without explicit confirmation
- ⚠️ **ALWAYS** create Prisma migrations for schema changes
- ⚠️ **ALWAYS** add indexes for UTxO queries (txHash, address, policyId)
- ⚠️ **ALWAYS** use database transactions for multi-step operations
- ⚠️ **ALWAYS** validate blockchain data before storing (malformed datums, invalid addresses)
- ⚠️ **SYNC** blockchain state regularly (UTxOs, protocol parameters)

### Dependencies (Cardano Stack)
- ⚠️ **ALWAYS** check for vulnerabilities before adding packages
- ⚠️ **PREFER** well-maintained packages with recent updates
- ⚠️ **USE** `@lucid-evolution/lucid` for frontend transactions
- ⚠️ **USE** `@blaze-cardano/sdk` for backend transaction building
- ⚠️ **USE** Dolos for lightweight node operations (not full cardano-node)
- ⚠️ **KEEP** Aiken updated (`aiken update`)
- ⚠️ **DOCUMENT** why specific versions are pinned

## 🤖 AI Agent Workflow

### Before Making Changes
1. **Understand Context**: Use `search` to find related code (check both frontend and backend)
2. **Check Patterns**: Look for existing Cardano patterns (wallet connection, transaction building)
3. **Verify Types**: Check type definitions in `packages/shared/types` and Aiken blueprints
4. **Review Tests**: Examine existing test patterns (Jest for TS, Aiken tests for validators)
5. **Check Validators**: If modifying smart contracts, review Aiken validators in `aiken/validators`

### When Implementing Features (Cardano-Specific)
1. **Plan First**: Use `/plan` mode for complex features (especially smart contract changes)
2. **Write Tests First**: Follow TDD approach
   - Aiken: Write property-based tests first
   - Frontend: Test wallet connection and transaction building
   - Backend: Test UTxO queries and synchronization
3. **Implement Incrementally**: Small, testable changes
   - Smart contracts → Compile → Frontend integration → Backend sync
4. **Compile Aiken**: Run `aiken build` after validator changes
5. **Update Documentation**: Keep comments and docs current
6. **Run All Tests**: `turbo test` (runs all package tests including Aiken)

### Error Recovery
If you make a mistake:
1. Acknowledge the error clearly
2. Explain what went wrong
3. Propose a fix
4. Wait for confirmation before proceeding

## 📝 Code Review Checklist (Cardano Edition)

Before submitting code, verify:
- [ ] TypeScript compiles without errors (`turbo build`)
- [ ] Aiken compiles without errors (`aiken check && aiken build`)
- [ ] All tests pass (`turbo test` + `aiken test`)
- [ ] No console.log or debug code
- [ ] Error handling for transaction failures
- [ ] Types are explicit (no 'any'), datum schemas match validators
- [ ] Comments explain 'why', not 'what'
- [ ] No hardcoded addresses, policy IDs, or mnemonics
- [ ] Wallet connection tested on testnet (Preprod/Preview)
- [ ] Transaction fees calculated correctly
- [ ] UTxO selection handles edge cases
- [ ] Responsive design (if UI changes)
- [ ] Accessibility standards met (if UI changes)

## 🔄 Git Workflow

### Commit Messages
Follow Conventional Commits:
```
feat: add user authentication
fix: resolve memory leak in data fetching
docs: update API documentation
test: add integration tests for auth
refactor: simplify error handling logic
```

### Branch Naming
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `refactor/component-name` - Code refactoring
- `docs/what-changed` - Documentation updates

## 🎨 UI/UX Guidelines

### Component Development
- **Mobile-first**: Design for mobile, enhance for desktop
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation
- **Performance**: Lazy load images, code split routes
- **Consistency**: Use design system components

### User Feedback
- Show loading states for async operations
- Display clear error messages
- Provide success confirmations
- Use optimistic updates when safe

## 📚 Documentation Requirements

### Code Comments
```typescript
// ✅ Good: Explains why
// Using exponential backoff to handle rate limits
const delay = Math.pow(2, attempt) * 1000;

// ❌ Bad: Explains what (code already does that)
// Set delay variable
const delay = Math.pow(2, attempt) * 1000;
```

### Function Documentation
```typescript
/**
 * Authenticates user and generates JWT token
 *
 * @param credentials - User email and password
 * @returns JWT token and user data
 * @throws AuthenticationError if credentials invalid
 */
async function authenticate(credentials: Credentials): Promise<AuthResult> {
  // Implementation
}
```

## 🧪 Testing Standards

### Test Coverage
- **Unit Tests**: All utility functions and hooks
- **Integration Tests**: API endpoints and database operations
- **Component Tests**: User interactions and edge cases
- **E2E Tests**: Critical user flows

### Test Structure
```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = { email: 'test@example.com', name: 'Test' };

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(userData.email);
    });

    it('should throw error for duplicate email', async () => {
      // Test implementation
    });
  });
});
```

## 🔍 Performance Guidelines

### Frontend
- Bundle size < 200KB (gzipped)
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Lighthouse score > 90

### Backend
- API response time < 200ms (p95)
- Database query time < 50ms
- Memory usage < 512MB
- CPU usage < 70%

## 🌐 Environment Configuration

### Required Environment Variables
```bash
# Cardano Network
CARDANO_NETWORK=Preprod  # or Mainnet, Preview
DOLOS_URL=http://localhost:50051
KUPO_URL=http://localhost:1442

# Provider API Keys (optional, if not using Dolos)
KOIOS_API_KEY=your-koios-key
BLOCKFROST_API_KEY=your-blockfrost-key
MAESTRO_API_KEY=your-maestro-key

# Database (for off-chain data)
DATABASE_URL=postgresql://user:pass@localhost:5432/cardano_db

# Backend API
API_URL=http://localhost:3001
API_PORT=3001

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_NETWORK=Preprod

# Application
NODE_ENV=development
PORT=3000

# Optional: Analytics, monitoring
SENTRY_DSN=your-sentry-dsn
```

## 📊 Monitoring & Logging

### Logging Standards
- **Error**: Application errors, exceptions
- **Warn**: Deprecated features, slow queries
- **Info**: Significant events, state changes
- **Debug**: Development debugging (not in production)

### What to Log
```typescript
// ✅ DO: Log errors with context
logger.error('Failed to create user', {
  error: error.message,
  email: userData.email,
  timestamp: new Date()
});

// ❌ DON'T: Log sensitive data
logger.debug('User login', { password: 'secret123' }); // NEVER!
```

## 🚀 Deployment Checklist (Cardano dApp)

Before deploying to production:
- [ ] All tests passing (TypeScript + Aiken tests)
- [ ] Aiken validators audited for security (use `/aiken` mode)
- [ ] Smart contracts tested on testnet thoroughly
- [ ] Security scan completed (no critical vulnerabilities)
- [ ] Performance benchmarks met (transaction building < 2s)
- [ ] Database migrations tested
- [ ] Dolos node synced and healthy
- [ ] Environment variables configured (Mainnet endpoints)
- [ ] Wallet integrations tested (Nami, Eternl, Lace, Vespr)
- [ ] Transaction fees acceptable on mainnet
- [ ] UTxO indexing working correctly
- [ ] Monitoring and alerts set up (node health, transaction failures)
- [ ] Rollback plan documented (especially for contract upgrades)
- [ ] Stakeholders notified
- [ ] CIP compliance verified (CIP-30 for wallets, CIP-68 for NFTs if applicable)

## 💡 AI Assistant Preferences

### Communication Style
- Be concise but thorough
- Ask clarifying questions when ambiguous
- Explain trade-offs for architectural decisions
- Suggest improvements proactively
- Admit when uncertain

### Code Generation
- Prioritize readability over cleverness
- Include error handling by default
- Add TypeScript types explicitly
- Write self-documenting code
- Follow existing patterns in codebase

### Problem Solving (Cardano Context)
1. **Analyze**: Understand the requirement fully (frontend, backend, or smart contract?)
2. **Research**: Check existing implementations
   - Frontend: Look for similar transaction patterns
   - Backend: Check UTxO query patterns
   - Smart contracts: Review Aiken stdlib and examples
3. **Plan**: Outline approach before coding
   - Use `/plan` mode for complex features
   - Consider on-chain vs off-chain logic
4. **Implement**: Write code incrementally
   - Smart contracts → Compile → Integration
5. **Verify**: Test thoroughly
   - Testnet first, always
   - Property-based tests for validators
6. **Document**: Update relevant docs
   - Transaction flows
   - Datum/redeemer schemas
   - API endpoints

---

## 🔗 Quick Start Commands

```bash
# Install dependencies
pnpm install

# Start Dolos node (in packages/dolos)
docker-compose up -d

# Build all packages (including Aiken)
turbo build

# Run development servers
turbo dev  # Starts Next.js (3000) + API (3001)

# Test everything
turbo test

# Aiken specific commands
cd aiken
aiken check          # Type check validators
aiken build          # Compile to Plutus
aiken test           # Run property tests
```

## 📚 Specialized AI Chat Modes

Use these modes for specific tasks:
- `/plan` - Complex feature planning with research todos
- `/implement` - TDD-focused implementation
- `/aiken` - Aiken smart contract security audit
- `/cardano-frontend` - Lucid Evolution + React patterns
- `/cardano-backend` - Blaze + Dolos integration

---

**Note**: This file is read by AI agents automatically. Keep it updated as the project evolves. For conditional rules by file type, see `.github/instructions/*.instructions.md`.

# Cardano Fullstack Starter (Turborepo)

A turnkey monorepo for Cardano dApp development:

- Next.js 15 (frontend) + Lucid Evolution
- Express (backend) + Blaze SDK
- Dolos (lightweight data node) — optional Kupmios (Ogmios + Kupo) if needed
- Aiken (smart contracts)
- Turborepo orchestration

## Prerequisites

- Node.js 20+
- PNPM 9+
- Docker (for Dolos/Ogmios/Kupo)
- Aiken CLI

## Quick Start

```bash
# 1) Copy env template
cp .env.example .env

# 2) Install deps (root)
pnpm install

# 3) Start Dolos (optional)
# The repo provides a Dolos compose; Ogmios/Kupo are not started by default.
pnpm infra:up                         # starts Dolos only (see packages/dolos)

# 4) Build all packages (includes Aiken check/build)
pnpm run build

# 5) Run development servers (Next.js 3000 + API 3001)
pnpm run dev
```

### Running without Docker (optional)

If you don't want local containers, point the backend to hosted providers (Maestro, Blockfrost, Koios) or a remote Kupmios-compatible endpoint by setting the corresponding environment variables in `.env` and skip `pnpm infra:up`.

To stop the local infra:

```powershell
pnpm infra:down
```

### API quick check

Once the API is running:

```bash
# Check Cardano provider readiness and endpoints
curl -s http://localhost:3001/cardano/status | jq .
```

This returns JSON fields including `ready`, `ogmiosUrl`, `kupoUrl`, and Dolos health if configured. If you’re pointing to remote endpoints via `.env`, Docker isn’t required.

## Aiken

```bash
cd aiken
aiken check          # Type check
aiken build          # Compile to Plutus
aiken test           # Property tests
```

Note: There are no default validators included. Create your own under `aiken/validators/`. See `aiken/README.md`.

## Folders

- apps/web: Next.js frontend
- apps/api: Express backend
- packages/dolos: Docker config for Dolos/Ogmios/Kupo
- packages/shared: Shared types
- aiken: Smart contracts

## Notes

- Preprod network by default; switch via env vars in `.env`.
- For production: secure your mnemonics and API keys; never commit secrets.

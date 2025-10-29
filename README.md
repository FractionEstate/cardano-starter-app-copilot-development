# Cardano Fullstack Starter (Turborepo)

A turnkey monorepo for Cardano dApp development:

- Next.js 14 (frontend) + Lucid Evolution
- Express (backend) + Blaze SDK
- Dolos, Ogmios, Kupo (node + indexers)
- Aiken (smart contracts)
- Turborepo orchestration

## Prerequisites

- Node.js 20+
- PNPM 9+
- Docker (for Dolos/Ogmios/Kupo)
- Aiken CLI

## Quick Start

```powershell
# 1) Copy env template
Copy-Item .env.example .env

# 2) Install deps (root)
pnpm install

# 3) Start node services (Dolos, Ogmios, Kupo)
# Option A (recommended): via monorepo scripts
pnpm infra:up

# Option B (manual): run from packages/dolos
# cd packages/dolos; docker compose up -d; cd ../..

# 4) Build all packages (includes Aiken)
pnpm run build

# 5) Dev servers (Next.js 3000 + API 3001)
pnpm run dev
```

### Running without Docker (optional)

If you don't want local containers, you can point the backend to hosted providers (e.g., Maestro, Blockfrost, Koios) or a remote Kupmios-compatible endpoint by setting the corresponding environment variables in `.env` and skipping `pnpm infra:up`.

To stop the local infra:

```powershell
pnpm infra:down
```

### API quick check

Once the API is running:

```powershell
# Check Cardano provider readiness and endpoints
Invoke-WebRequest http://localhost:3001/cardano/status | Select-Object -ExpandProperty Content
```

This returns a JSON with `ready`, `ogmiosUrl`, and `kupoUrl`. If you’re pointing to remote endpoints via `.env`, Docker isn’t required.

## Aiken

```powershell
cd aiken
# Type check
 aiken check
# Compile to Plutus
 aiken build
# Property tests
 aiken test
```

## Folders

- apps/web: Next.js frontend
- apps/api: Express backend
- packages/dolos: Docker config for Dolos/Ogmios/Kupo
- packages/shared: Shared types
- aiken: Smart contracts

## Notes

- Use Preprod network by default; switch via env vars in `.env`.
- For production: secure your mnemonics and API keys; never commit secrets.

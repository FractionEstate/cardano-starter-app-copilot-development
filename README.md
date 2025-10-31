# Cardano Fullstack Starter (Turborepo)

A turnkey monorepo for Cardano dApp development:

- Next.js 15 (frontend) — WASM-free (no Lucid in browser)
- Express (backend) + Blaze SDK (server-side transaction building)
- Kupmios (Ogmios + Kupo) for building/reads, with Dolos REST fallback for reads
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

### Transaction API and DSL

Backend provides endpoints under `/cardano`:

- `GET /status` and `GET /dolos-status` — provider readiness
- `GET /address/:address/balance` — lovelace balance (Kupmios preferred; Dolos REST fallback)
- `GET /address/:address/utxos` — UTxOs for address (Kupmios preferred; Dolos REST fallback)
- `POST /txs/build/send-ada` — build unsigned ADA payment
- `POST /txs/build` — generic JSON DSL → unsigned CBOR

DSL actions supported (non-exhaustive):

- `payLovelace`, `payAssets`, `metadata`, `validity`, `requiredSigner`, `changeAddress`, `collateral`, `referenceInput`, `spendUtxo`, `attachScript`
- New: `payMany` (bulk outputs), `stakeRegister`, `stakeDeregister`, `withdrawRewards`, `feePolicy` (best-effort hint)

Frontend flow is WASM-free: CIP-30 connect → server builds → client signs and submits.

Input validation is enforced with Zod on the backend (addresses, payload shape); invalid payloads return HTTP 400 with details.

### Optional API rate limiting

You can enable lightweight rate limiting on the `/cardano` routes:

- `RATE_LIMIT_ENABLED=true` to enable in any environment
- By default, it’s also enabled automatically in `NODE_ENV=production` unless `RATE_LIMIT_ENABLED=false`
- Tunables:
	- `RATE_LIMIT_WINDOW_MS` (default: `60000`)
	- `RATE_LIMIT_MAX` (default: `60` requests per window)
	- `RATE_LIMIT_TRUST_PROXY=true` if sitting behind a proxy (sets `app.set('trust proxy', 1)`)

When enabled, excessive requests will receive a JSON response:

```json
{ "success": false, "error": "Too many requests" }
```

#### Example: payMany

```json
{
	"fromAddress": "addr_test1...",
	"actions": [
		{
			"type": "payMany",
			"outputs": [
				{ "toAddress": "addr_test1qpto...", "lovelace": "1000000" },
				{ "toAddress": "addr_test1qqqq...", "assets": { "<policy>.<asset>": 1 } }
			]
		}
	]
}
```

#### Example: staking and rewards

```json
{
	"fromAddress": "addr_test1...",
	"actions": [
		{ "type": "stakeRegister", "stakeAddress": "stake_test1u..." },
		{ "type": "withdrawRewards", "stakeAddress": "stake_test1u...", "amount": "5000000" },
		{ "type": "stakeDeregister", "stakeAddress": "stake_test1u..." }
	]
}
```

#### Example: feePolicy hint

```json
{
	"fromAddress": "addr_test1...",
	"actions": [
		{ "type": "feePolicy", "strategy": "auto", "multiplier": 1.1 },
		{ "type": "payLovelace", "toAddress": "addr_test1qpto...", "lovelace": "2000000" }
	]
}
```

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
- packages/shared: Shared types and tiny API client helpers
- aiken: Smart contracts

## Notes

- Preprod network by default; switch via env vars in `.env`.
- For production: secure your mnemonics and API keys; never commit secrets.

## Wallet Connector behavior

The wallet connector is implemented in `apps/web/src/contexts/CardanoContext.tsx` and `WalletModal`:

- Network enforcement via `getNetworkId` against `NEXT_PUBLIC_NETWORK`
- Auto-reconnect using `localStorage` (last wallet key persisted)
- `isConnecting` state to prevent double-connect and show spinners
- Sign message via `signData` (when supported)
- Balance refresh on tab focus
- Installed wallet discovery (icons shown in Connect button)

You’ll also find a "Peer Connect" tab in the Wallet modal as a placeholder for future CIP-45 device-to-device pairing, and a toggleable Wallet Details panel (stake address, used/unused addresses, installed wallets) under the header when connected.

Reusable `ConnectWalletButton` renders detected wallet icons and a progress spinner while connecting.

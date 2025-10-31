# API Service

Express API for Cardano backend utilities.

## Configuration

Environment variables:

- OGMIOS_URL: Ogmios endpoint (default http://localhost:1337)
- KUPO_URL:   Kupo endpoint (default http://localhost:1442)
- DOLOS_GRPC_URL: Dolos gRPC (default http://localhost:50051)
- DOLOS_REST_URL: Dolos REST (Blockfrost-like) (default http://localhost:4000)
- API_PORT:   API server port (default 3001)

When running the local Dolos stack (packages/dolos), ensure you also have valid Ogmios/Kupo endpoints. The provided compose file is development-oriented; if Ogmios/Kupo are not backed by a synced node, they may restart.

For hosted providers, set OGMIOS_URL and KUPO_URL to the provider URLs. For Dolos, ensure the REST endpoint is reachable; readiness uses `/health`.

## Endpoints

- GET /health          — basic liveness check
- GET /cardano/status  — readiness + endpoint diagnostics
- GET /cardano/dolos-status — Dolos-only readiness
- GET /cardano/dolos/health — Proxy Dolos Blockfrost-like health (/health)

Example response (/cardano/status):

```json
{
  "success": true,
  "ready": true,
  "ogmiosUrl": "http://localhost:1337",
  "kupoUrl": "http://localhost:1442",
  "ogmiosReachable": false,
  "kupoReachable": false,
  "dolosGrpcUrl": "http://localhost:50051",
  "dolosRestUrl": "http://localhost:4000",
  "dolosGrpcReachable": false,
  "dolosRestReachable": true,
  "dolosRestHealthy": true
}
```

## Development

```bash
# Install deps
pnpm install

# Run in watch mode
pnpm --filter api dev

# Run tests
pnpm --filter api test
```

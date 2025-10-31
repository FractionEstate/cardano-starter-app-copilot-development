# Dolos Setup

This package contains Docker configuration for running a lightweight Cardano data node (Dolos).

Important
- Dolos is a standalone data node exposing gRPC and a Blockfrost-like HTTP API ("minibf"). It does NOT provide Ogmios or Kupo endpoints.
- If you use Blaze's Kupmios provider, you still need Ogmios + Kupo backed by a synced node (or a hosted provider). Dolos is complementary, not a drop-in replacement for Kupmios.
- Dolos REST is mapped to host port 4000 here (to avoid conflict with Next.js dev on 3000).

## Quick Start

```bash
# From packages/dolos
# 1) Download genesis JSON files for your network (example: preprod)
curl -L -o config/genesis/byron.json   https://book.world.dev.cardano.org/snapshots/preprod/byron-genesis.json
curl -L -o config/genesis/shelley.json https://book.world.dev.cardano.org/snapshots/preprod/shelley-genesis.json
curl -L -o config/genesis/alonzo.json  https://book.world.dev.cardano.org/snapshots/preprod/alonzo-genesis.json
curl -L -o config/genesis/conway.json  https://book.world.dev.cardano.org/snapshots/preprod/conway-genesis.json

# 2) Start Dolos (will use config/dolos.toml)
docker compose up -d
docker compose logs -f dolos
```

Bootstrap
- For faster sync, consider running `dolos bootstrap` (Mithril) from a shell inside the container or by using a one-off container. See https://docs.txpipe.io/dolos for details.

Endpoints:

- Dolos gRPC: http://localhost:50051
- Dolos REST: http://localhost:4000

API configuration (apps/api):

- OGMIOS_URL (default http://localhost:1337)  # for Kupmios (if used)
- KUPO_URL   (default http://localhost:1442)  # for Kupmios (if used)
- DOLOS_GRPC_URL (default http://localhost:50051)
- DOLOS_REST_URL (default http://localhost:4000)

The API route GET /cardano/status returns:

```json
{
	"success": true,
	"ready": false,
	"ogmiosUrl": "http://localhost:1337",
	"kupoUrl": "http://localhost:1442",
	"ogmiosReachable": false,
	"kupoReachable": false
}
```

If using hosted providers, set OGMIOS_URL and KUPO_URL accordingly before starting the API. For Dolos, ensure the genesis files are present and configure `config/dolos.toml` for your network.

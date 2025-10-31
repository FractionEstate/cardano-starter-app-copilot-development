# Dolos Setup

This package contains Docker configuration for running a lightweight Cardano data node (Dolos).

Important
- Dolos is a standalone data node exposing gRPC and a Blockfrost-like HTTP API ("minibf"). It does NOT provide Ogmios or Kupo endpoints.
- If you use Blaze's Kupmios provider, you still need Ogmios + Kupo backed by a synced node (or a hosted provider). Dolos is complementary, not a drop-in replacement for Kupmios.
- Dolos REST is mapped to host port 4000 here (to avoid conflict with Next.js dev on 3000).

## Quick Start

```bash
# From packages/dolos
# 1) Provide genesis JSON files for your target network (example: preprod)
#    Follow the official docs for up-to-date links:
#    https://docs.txpipe.io/dolos/configuration/schema (genesis section)
#    Or run the interactive initializer inside the container to set everything up:
#    docker compose run --rm dolos dolos init
#    (The compose mounts ./config read-write and enables TTY for this purpose.)

# 2) Start Dolos (will use config/dolos.toml)
docker compose up -d
docker compose logs -f dolos

# 3) (Optional) Bootstrap to speed up sync (choose one):
#    Dolos Snapshot (full/ledger):
#    docker compose run --rm dolos dolos bootstrap snapshot --variant ledger
#    Mithril Snapshot (preprod example):
#    docker compose run --rm dolos dolos bootstrap mithril \
#      --aggregator https://aggregator.release-preprod.api.mithril.network/aggregator
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

If using hosted providers, set OGMIOS_URL and KUPO_URL accordingly before starting the API. For Dolos, ensure the genesis files are present (or run `dolos init` in the container), and configure `config/dolos.toml` for your network. See https://docs.txpipe.io/dolos for details.

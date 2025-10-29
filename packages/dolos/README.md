# Dolos Setup

This package contains Docker configuration for running a lightweight Cardano data node (Dolos), plus Ogmios and Kupo for Kupmios-compatible providers.

## Quick Start

```powershell
# From packages/dolos
docker compose up -d
```

Endpoints:

- Dolos gRPC: <http://localhost:50051>
- Dolos REST: <http://localhost:3000>
- Ogmios: <http://localhost:1337>
- Kupo: <http://localhost:1442>

# Dev Container Troubleshooting

If VS Code opens a Recovery Container (or you see "no such daemon" / Docker errors), try these steps.

## 1) Rebuild the container without cache

Use the Command Palette:

- Dev Containers: Rebuild Container without Cache

This picks up the local override `.devcontainer/devcontainer.local.json` which enables Docker rootless mode and a resilient post-create.

## 2) Ensure Docker works inside the container (optional)

The configuration uses the `docker-in-docker` feature in rootless mode. On hosts that don't allow nested Docker, you can still run the app without Dolos/Kupo/Ogmios by skipping infra:

```bash
# Inside the devcontainer
pnpm install
pnpm dev
```

## 3) Manual setup if post-create failed

Run the manual setup:

```bash
pnpm setup:container
```

This will:
- Enable corepack (if available) and activate pnpm@9
- Run `pnpm install`
- Install Aiken using a prebuilt binary if possible

## 4) Common issues

- "no such daemon": fixed by rootless Docker in `.devcontainer/devcontainer.local.json`. Rebuild without cache.
- `pnpm` not found: post-create should activate pnpm; if not, run `pnpm setup:container` manually.
- Aiken installation slow: the installer now prefers prebuilt binaries before falling back to `cargo install`.

## 5) Verify services

- Frontend: http://localhost:3000
- API: http://localhost:3001/health

If you need Dolos/Kupo/Ogmios, start them later via `pnpm infra:up` once Docker-in-Docker is healthy.

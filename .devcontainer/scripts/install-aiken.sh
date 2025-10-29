#!/usr/bin/env bash
set -euo pipefail

# install-aiken.sh
# Installs Aiken quickly using a prebuilt binary when possible,
# and falls back to `cargo install aiken --locked` if necessary.

AIKEN_VERSION="${AIKEN_VERSION:-v1.0.28}"
INSTALL_DIR="/usr/local/bin"
TMP_DIR="$(mktemp -d)"
ARCH="$(uname -m)"
OS="$(uname -s)"

cleanup() {
  rm -rf "$TMP_DIR" || true
}
trap cleanup EXIT

log() {
  echo "[install-aiken] $*"
}

have_cmd() {
  command -v "$1" >/dev/null 2>&1
}

# Determine target triple and asset name heuristically
case "$OS" in
  Linux)
    case "$ARCH" in
      x86_64|amd64)
        TARGET_TRIPLE="x86_64-unknown-linux-gnu"
        ;;
      aarch64|arm64)
        TARGET_TRIPLE="aarch64-unknown-linux-gnu"
        ;;
      *)
        TARGET_TRIPLE=""
        ;;
    esac
    ;;
  Darwin)
    case "$ARCH" in
      x86_64|amd64)
        TARGET_TRIPLE="x86_64-apple-darwin"
        ;;
      arm64|aarch64)
        TARGET_TRIPLE="aarch64-apple-darwin"
        ;;
      *)
        TARGET_TRIPLE=""
        ;;
    esac
    ;;
  *)
    TARGET_TRIPLE=""
    ;;
esac

try_prebuilt() {
  if [[ -z "$TARGET_TRIPLE" ]]; then
    return 1
  fi

  # Common Aiken release asset pattern (best effort)
  local base_url="https://github.com/aiken-lang/aiken/releases/download/${AIKEN_VERSION}"
  local tarball="aiken-${TARGET_TRIPLE}.tar.gz"
  local url="${base_url}/${tarball}"

  log "Attempting to download prebuilt Aiken: ${url}"
  if curl -fsSL "$url" -o "$TMP_DIR/aiken.tar.gz"; then
    tar -xzf "$TMP_DIR/aiken.tar.gz" -C "$TMP_DIR"
    if [[ -f "$TMP_DIR/aiken" ]]; then
      log "Installing Aiken to ${INSTALL_DIR} (requires sudo if not root)"
      if [[ "$EUID" -ne 0 ]]; then
        sudo mv "$TMP_DIR/aiken" "$INSTALL_DIR/aiken"
        sudo chmod +x "$INSTALL_DIR/aiken"
      else
        mv "$TMP_DIR/aiken" "$INSTALL_DIR/aiken"
        chmod +x "$INSTALL_DIR/aiken"
      fi
      return 0
    fi
  fi
  return 1
}

try_cargo() {
  if have_cmd cargo; then
    log "Building Aiken from source with cargo (this may take a while)"
    cargo install aiken --locked
    return 0
  fi
  return 1
}

# If Aiken already exists, skip
if have_cmd aiken; then
  log "Aiken already installed: $(aiken --version)"
  exit 0
fi

if try_prebuilt; then
  log "Aiken installed successfully via prebuilt binary: $(aiken --version || true)"
  exit 0
fi

if try_cargo; then
  log "Aiken installed successfully via cargo: $(aiken --version || true)"
  exit 0
fi

log "Failed to install Aiken via prebuilt binary and cargo is not available."
exit 1

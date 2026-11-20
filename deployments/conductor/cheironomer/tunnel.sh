#!/usr/bin/env bash
set -euo pipefail
: "${CHEIR_TUNNEL_NAME:?Set the authorized named Cloudflare Tunnel}"
: "${CHEIR_TUNNEL_CONFIG:?Set the local cloudflared configuration file}"
[[ -r "$CHEIR_TUNNEL_CONFIG" ]] || exit 64
cloudflared tunnel --config "$CHEIR_TUNNEL_CONFIG" ingress validate
exec cloudflared tunnel --config "$CHEIR_TUNNEL_CONFIG" run "$CHEIR_TUNNEL_NAME"

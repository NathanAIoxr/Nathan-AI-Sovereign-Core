#!/usr/bin/env bash
set -euo pipefail

if (( EUID != 0 )); then
  printf '%s\n' 'Run this installer on nathan-1 with sudo.' >&2
  exit 1
fi
if [[ "$(hostname -s)" != nathan-1 ]]; then
  printf '%s\n' 'Expected the NUTSY Ubuntu host nathan-1.' >&2
  exit 1
fi

source_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
config=/etc/nutsy-email-intake.env
if [[ ! -f "$config" || -L "$config" || "$(stat -c '%u:%a' "$config")" != 0:600 ]]; then
  printf '%s\n' 'Create the root-owned mode-0600 /etc/nutsy-email-intake.env first.' >&2
  exit 1
fi

install -d -m 0755 /opt/nutsy-email-intake
install -m 0644 "$source_dir/ear1.py" "$source_dir/review.py" /opt/nutsy-email-intake/
install -m 0644 "$source_dir/nutsy-email-intake.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable nutsy-email-intake.service
systemctl restart nutsy-email-intake.service
systemctl is-active nutsy-email-intake.service

#!/usr/bin/env bash
set -euo pipefail

phase="${PAM_TYPE:-}"

if [ "$phase" != "account" ]; then
  exit 0
fi

ALLOW_CIDRS="${ALLOW_CIDRS:-}"
RHOST="${PAM_RHOST:-}"
if [ -z "$ALLOW_CIDRS" ] || [ -z "$RHOST" ]; then
  exit 0
fi

ok=1
IFS=',' read -r -a cidrs <<< "$ALLOW_CIDRS"
for c in "${cidrs[@]}"; do
  if command -v ipcalc >/dev/null 2>&1; then
    ipcalc -c "$RHOST" "$c" >/dev/null 2>&1 && ok=0 && break
  else
    [ "$RHOST" = "$c" ] && ok=0 && break
  fi
done

exit $ok

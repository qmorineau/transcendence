#!/usr/bin/env bash
set -euo pipefail

# Resource clamps
ulimit -n 1024
ulimit -c 0
ulimit -t 300
ulimit -v 1048576

export NODE_ENV=production
export API_BASE="${API_BASE:-http://web:3000}"
export PATH="/usr/local/bin:/usr/bin:/bin"
export TERM="${TERM:-xterm-256color}"

resize() {
  if command -v stty >/dev/null 2>&1; then
    local rows cols
    rows=$(stty size 2>/dev/null | awk "{print \$1}") || true
    cols=$(stty size 2>/dev/null | awk "{print \$2}") || true
    [ -n "${rows:-}" ] && [ -n "${cols:-}" ] && printf '\033[8;%d;%dt' "$rows" "$cols" || true
  fi
}
trap resize SIGWINCH
resize

echo "Starting Pong CLI... "
echo "Authenticate inside the CLI when prompted."
[ -f /app/cli/pong.js ] || { echo "CLI missing at /app/cli/pong.js"; exit 1; }

# Drop privileges to the app user if invoked as root
if [ "$(id -u)" -eq 0 ]; then
  exec su -s /bin/sh -c "/usr/local/bin/node /app/cli/pong.js" player
else
  exec /usr/local/bin/node --trace-warnings /app/cli/pong.js
fi

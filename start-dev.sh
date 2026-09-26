#!/usr/bin/env bash
# Starts both the backend (port 4000) and frontend (port 5173) dev servers together.
# If you only start the frontend, AI chat / image gen / billing calls will fail with
# "Failed to fetch" because there's nothing listening on port 4000.
set -e

cleanup() {
  echo "Stopping dev servers..."
  kill 0
}
trap cleanup EXIT INT TERM

(cd "$(dirname "$0")/backend" && npm run dev) &
(cd "$(dirname "$0")/frontend" && npm run dev) &

wait

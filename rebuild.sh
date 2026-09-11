#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Stopping dev servers..."
pkill -f "next dev" 2>/dev/null || true
lsof -ti:3000 -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

echo "Building..."
npm run build

echo "Starting dev server..."
npm run dev

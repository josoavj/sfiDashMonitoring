#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "Starting backend..."
if [ ! -d "node_modules" ]; then
  echo "Installing backend dependencies..."
  npm install
fi

if [ ! -f ".env" ]; then
  echo "Warning: .env not found. Copy envDefault to .env and configure it."
fi

mkdir -p ../logs
nohup node server.js > ../logs/backend.log 2>&1 &
echo "Backend started (pid $!)"

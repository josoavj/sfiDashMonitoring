#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 Starting SFI Dash Monitoring Backend..."

# Create necessary directories
echo "📁 Creating data directory..."
mkdir -p ../data
mkdir -p ../logs

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  npm install
fi

# Check .env configuration
if [ ! -f ".env" ]; then
  echo "⚠️  .env not found. Copying from envDefault..."
  cp envDefault .env
  echo "✅ Created .env (please update with your configuration)"
fi

# Start backend
echo "⚙️  Starting Node.js server..."
nohup node server.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (pid $BACKEND_PID)"
echo "📝 Logs: ../logs/backend.log"
echo "🔗 Backend running at: http://localhost:3001"

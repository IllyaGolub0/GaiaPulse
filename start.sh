#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

PYTHON_BIN=""
if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "Error: Python 3.11+ is required." >&2
  exit 1
fi

if [ ! -d ".venv" ]; then
  echo "Creating Python virtual environment (.venv)..."
  "$PYTHON_BIN" -m venv .venv
fi

source .venv/bin/activate
python -m pip install --quiet --upgrade pip
python -m pip install --quiet -r requirements.txt

if [ ! -d "frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  (cd frontend && npm install)
fi

cleanup() {
  echo "Stopping servers..."
  kill 0 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting FastAPI Backend on http://localhost:8000 ..."
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &

echo "Starting Vite Frontend on http://localhost:5173 ..."
(cd frontend && npm run dev -- --host 0.0.0.0 --port 5173) &

wait

#!/bin/bash
cd "$(dirname "$0")/backend"

# Create .env if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️  Created .env — fill in your SUPABASE_URL and SUPABASE_KEY before continuing."
  echo "    Then run this script again."
  exit 1
fi

# Install deps
pip install -r requirements.txt -q

# Run
echo "🚀 Starting FastAPI on http://localhost:8000"
uvicorn main:app --reload --port 8000

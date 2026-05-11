#!/bin/bash
cd "$(dirname "$0")/frontend"
echo "📦 Installing packages..."
npm install
echo "🚀 Starting Vite dev server on http://localhost:5173"
npm run dev

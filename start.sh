#!/bin/bash

# 1. Activate python environment
source .venv/bin/activate

# 2. Make sure postgres container is running
echo "Starting PostgreSQL container..."
docker start postgres 2>/dev/null || docker compose up -d postgres

sleep 3

# 3. Start FastAPI Backend Server
echo "Starting FastAPI Backend Server on port 8000..."
nohup uvicorn api:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

sleep 2

# 4. Start Ngrok tunnel for backend API
echo "Starting ngrok tunnel for FastAPI (port 8000)..."
ngrok http 8000 > ngrok.log 2>&1 &

sleep 4

NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok-free\.app')

echo "=========================================================="
echo "🚀 Backend API is running on: http://127.0.0.1:8000"
if [ -n "$NGROK_URL" ]; then
    echo "🌍 Public Ngrok API URL: $NGROK_URL"
    echo "👉 Update your Netlify environment variable (VITE_API_URL) with: $NGROK_URL"
else
    echo "⚠️ Ngrok tunnel started. Check http://127.0.0.1:4040 for public URL."
fi
echo "=========================================================="

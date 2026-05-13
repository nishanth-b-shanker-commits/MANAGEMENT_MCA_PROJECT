@echo off
echo Starting Backend Server...
start cmd /k "cd backend && npm install && node server.js"

echo Starting Frontend Server (Vite) on port 8000...
start cmd /k "cd frontend && npm install && npm run dev"

echo Both servers are starting up. The Vite dev server will automatically open your browser to http://localhost:8000.

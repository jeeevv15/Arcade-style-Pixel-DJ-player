#!/bin/bash

# ============================================================
#  PIXEL DJ MIXER — Start Script
# ============================================================

CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Detect OS for open-browser command
open_browser() {
  sleep 2
  if command -v xdg-open &>/dev/null; then
    xdg-open "http://localhost:3000"
  elif command -v open &>/dev/null; then
    open "http://localhost:3000"
  elif command -v start &>/dev/null; then
    start "http://localhost:3000"
  fi
}

cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down servers...${NC}"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  echo -e "${GREEN}Done. Bye!${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

echo ""
echo -e "${CYAN}┌─────────────────────────────────────┐${NC}"
echo -e "${CYAN}│   PIXEL DJ MIXER — STARTING UP      │${NC}"
echo -e "${CYAN}└─────────────────────────────────────┘${NC}"
echo ""

# ── Backend ──────────────────────────────────────────────────
echo -e "${MAGENTA}▶ Starting Python backend on :8000...${NC}"
cd backend

# Activate venv
if [ -d "venv/bin" ]; then
  source venv/bin/activate
elif [ -d "venv/Scripts" ]; then
  source venv/Scripts/activate
else
  echo -e "${RED}No venv found. Run ./setup.sh first.${NC}"
  exit 1
fi

python main.py &
BACKEND_PID=$!
cd ..

sleep 1

# Check backend started
if kill -0 $BACKEND_PID 2>/dev/null; then
  echo -e "${GREEN}✓ Backend running (PID $BACKEND_PID)${NC}"
else
  echo -e "${RED}✗ Backend failed to start. Check backend/main.py${NC}"
  exit 1
fi

# ── Frontend ─────────────────────────────────────────────────
echo -e "${MAGENTA}▶ Starting Next.js frontend on :3000...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}  Installing packages (first run)...${NC}"
  npm install -q
fi

npm run dev &
FRONTEND_PID=$!
cd ..

# ── Open browser ─────────────────────────────────────────────
open_browser &

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🎛  PIXEL DJ IS LIVE!                ║${NC}"
echo -e "${CYAN}╠═══════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  App  → http://localhost:3000         ║${NC}"
echo -e "${CYAN}║  API  → http://localhost:8000         ║${NC}"
echo -e "${CYAN}║  Docs → http://localhost:8000/docs    ║${NC}"
echo -e "${CYAN}╠═══════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  Press Ctrl+C to stop                 ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════╝${NC}"
echo ""

# Keep alive and pipe logs
wait $BACKEND_PID $FRONTEND_PID

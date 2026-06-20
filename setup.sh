#!/bin/bash

# ============================================================
#  PIXEL DJ MIXER — Setup Script
# ============================================================

set -e

CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}██████╗ ██╗██╗  ██╗███████╗██╗     ${NC}"
echo -e "${MAGENTA}██╔══██╗██║╚██╗██╔╝██╔════╝██║     ${NC}"
echo -e "${YELLOW}██████╔╝██║ ╚███╔╝ █████╗  ██║     ${NC}"
echo -e "${CYAN}██╔═══╝ ██║ ██╔██╗ ██╔══╝  ██║     ${NC}"
echo -e "${MAGENTA}██║     ██║██╔╝ ██╗███████╗███████╗${NC}"
echo -e "${YELLOW}╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝${NC}"
echo ""
echo -e "${CYAN}        DJ MIXER SETUP${NC}"
echo ""

# ── Check prerequisites ──────────────────────────────────────
echo -e "${YELLOW}[1/4] Checking prerequisites...${NC}"

if ! command -v python3 &>/dev/null; then
  echo -e "${RED}✗ Python 3 not found. Install from https://python.org${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Python3: $(python3 --version)${NC}"

if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ Node.js not found. Install from https://nodejs.org${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node: $(node --version)${NC}"

if ! command -v npm &>/dev/null; then
  echo -e "${RED}✗ npm not found.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ npm: $(npm --version)${NC}"

# ── Backend ──────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[2/4] Setting up Python backend...${NC}"

cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
  python3 -m venv venv
  echo -e "${GREEN}✓ Virtual environment created${NC}"
fi

# Activate and install
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo -e "${GREEN}✓ Python packages installed${NC}"

# Create output dir
mkdir -p output
echo -e "${GREEN}✓ Output directory ready${NC}"

deactivate
cd ..

# ── Frontend ─────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[3/4] Setting up Next.js frontend...${NC}"

cd frontend
npm install
echo -e "${GREEN}✓ Node packages installed${NC}"
cd ..

# ── Assets ──────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[4/4] Setting up assets...${NC}"

mkdir -p assets/fx audio
echo -e "${GREEN}✓ Asset folders ready${NC}"

# ── Done ─────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      SETUP COMPLETE! ✓               ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════╣${NC}"
echo -e "${CYAN}║                                      ║${NC}"
echo -e "${CYAN}║  To start: run ./start.sh            ║${NC}"
echo -e "${CYAN}║  Or manually:                        ║${NC}"
echo -e "${CYAN}║   Terminal 1: cd backend             ║${NC}"
echo -e "${CYAN}║               source venv/bin/activate║${NC}"
echo -e "${CYAN}║               python main.py         ║${NC}"
echo -e "${CYAN}║   Terminal 2: cd frontend            ║${NC}"
echo -e "${CYAN}║               npm run dev            ║${NC}"
echo -e "${CYAN}║                                      ║${NC}"
echo -e "${CYAN}║  Frontend: http://localhost:3000     ║${NC}"
echo -e "${CYAN}║  API Docs: http://localhost:8000/docs║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

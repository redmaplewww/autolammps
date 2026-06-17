#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# AutoLammps Deployment Script (Linux / macOS / WSL)
# ============================================================================
# Usage:
#   git clone https://github.com/redmaplewww/autolammps.git
#   cd autolammps
#   bash deploy.sh
#
# Or one-liner:
#   curl -sL https://raw.githubusercontent.com/redmaplewww/autolammps/main/deploy.sh | bash
# ============================================================================

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

echo ""
echo "=========================================="
echo "  AutoLammps Deployment"
echo "=========================================="
echo ""

# --- Step 0: Check dependencies ---------------------------------------------

info "Checking dependencies..."

if ! command -v git &>/dev/null; then
    error "git not found. Install: sudo apt install git  /  brew install git"
fi

if ! command -v bun &>/dev/null; then
    error "bun not found. Install: curl -fsSL https://bun.sh/install | bash"
fi

if ! command -v gzip &>/dev/null; then
    error "gzip not found. Install: sudo apt install gzip"
fi

if ! command -v lmp &>/dev/null; then
    warn "LAMMPS (lmp) not found in PATH. Simulation execution will not work until LAMMPS is installed."
    warn "Install: conda install -c conda-forge lammps  OR  build from source"
fi

if ! command -v python3 &>/dev/null; then
    warn "python3 not found. Post-processing scripts may not work."
fi

info "Dependencies OK."
echo ""

# --- Step 1: Ensure we are in the repo root --------------------------------

if [ ! -f "package.json" ] || [ ! -d ".angsheng" ]; then
    error "Not in AutoLammps repo root. Run this script from the cloned repo directory."
fi

REPO_ROOT="$(pwd)"
info "Repo root: $REPO_ROOT"

# --- Step 2: Install npm dependencies --------------------------------------

info "Installing dependencies (bun install)..."
bun install 2>/dev/null || error "bun install failed"
info "Dependencies installed."
echo ""

# --- Step 3: Decompress knowledge index ------------------------------------

CACHE_DIR=".angsheng/cache"
mkdir -p "$CACHE_DIR"

SQLITE_MAIN="$CACHE_DIR/lammps-knowledge.sqlite"
SQLITE_MAIN_GZ="$CACHE_DIR/lammps-knowledge.sqlite.gz"
SQLITE_LAYERED="$CACHE_DIR/lammps-knowledge-layered.sqlite"
SQLITE_LAYERED_GZ="$CACHE_DIR/lammps-knowledge-layered.sqlite.gz"
SQLITE_PIPELINE="$CACHE_DIR/lammps-kb-pipeline.sqlite"
SQLITE_PIPELINE_GZ="$CACHE_DIR/lammps-kb-pipeline.sqlite.gz"

NEED_REBUILD=false

# Main knowledge DB
if [ -f "$SQLITE_MAIN_GZ" ]; then
    info "Decompressing knowledge index (lammps-knowledge.sqlite.gz)..."
    gzip -dk "$SQLITE_MAIN_GZ"
    info "Knowledge index decompressed: $(du -h "$SQLITE_MAIN" | cut -f1)"
elif ls "$CACHE_DIR"/lammps-knowledge.sqlite.gz.part-* &>/dev/null 2>&1; then
    info "Reassembling chunked knowledge index..."
    cat "$CACHE_DIR"/lammps-knowledge.sqlite.gz.part-* > "$SQLITE_MAIN_GZ"
    gzip -dk "$SQLITE_MAIN_GZ"
    info "Knowledge index reassembled and decompressed: $(du -h "$SQLITE_MAIN" | cut -f1)"
elif [ -f "$SQLITE_MAIN" ]; then
    info "Knowledge index already exists, skipping decompression."
else
    warn "No compressed knowledge index found. Will rebuild from source files."
    NEED_REBUILD=true
fi

# Layered DB
if [ -f "$SQLITE_LAYERED_GZ" ]; then
    info "Decompressing layered index..."
    gzip -dk "$SQLITE_LAYERED_GZ"
elif [ ! -f "$SQLITE_LAYERED" ]; then
    warn "No layered index found (optional, non-blocking)."
fi

# Pipeline DB
if [ -f "$SQLITE_PIPELINE_GZ" ]; then
    info "Decompressing KB pipeline index..."
    gzip -dk "$SQLITE_PIPELINE_GZ"
fi
echo ""

# --- Step 4: Rebuild index if needed ---------------------------------------

if [ "$NEED_REBUILD" = true ]; then
    info "Rebuilding knowledge index from source files..."
    info "This may take 1-3 minutes..."
    bun -e "
        import { buildKnowledgeIndex } from './src/utils/lammpsKnowledge/indexer.js';
        const r = await buildKnowledgeIndex();
        console.log('Indexed:', r.indexedFiles, 'files,', r.indexedChunks, 'chunks');
        if (r.indexedFiles < 100) {
            console.error('WARNING: Unexpectedly few files indexed. Check knowledge/ directory.');
            process.exit(1);
        }
    " 2>/dev/null || error "Index rebuild failed"
    info "Knowledge index rebuilt successfully."
else
    info "Skipping index rebuild (using shipped index)."
    info "To force rebuild: bun run rebuild-knowledge"
fi
echo ""

# --- Step 5: Verify MCP server starts --------------------------------------

info "Verifying MCP server..."
timeout 5 bun run src/entrypoints/cli.tsx --lammps-knowledge-mcp &>/dev/null
if [ $? -eq 0 ] || [ $? -eq 124 ]; then
    info "MCP server starts OK."
else
    warn "MCP server test failed. Agents will attempt to rebuild index on demand."
fi
echo ""

# --- Step 6: Check API configuration ---------------------------------------

SETTINGS_FILE=".angsheng/settings.json"
SETTINGS_LOCAL=".angsheng/settings.local.json"

API_CONFIGURED=false
if grep -q "ANTHROPIC_API_KEY\|OPENAI_API_KEY\|DEEPSEEK_API_KEY" "$SETTINGS_FILE" "$SETTINGS_LOCAL" 2>/dev/null; then
    if grep -qE "ANTHROPIC_API_KEY.*[a-zA-Z0-9]{20}" "$SETTINGS_FILE" "$SETTINGS_LOCAL" 2>/dev/null; then
        API_CONFIGURED=true
    fi
fi

if [ "$API_CONFIGURED" = true ]; then
    info "API key detected in settings."
else
    warn "No API key found in settings files."
    warn "Edit .angsheng/settings.json and set your API key:"
    echo ""
    echo '    "env": {'
    echo '        "ANTHROPIC_API_KEY": "your-key-here"'
    echo '    }'
    echo ""
    warn "Or set environment variable: export ANTHROPIC_API_KEY=your-key"
fi
echo ""

# --- Done ------------------------------------------------------------------

echo "=========================================="
echo "  ${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "  Next steps:"
echo ""
echo "  1. Edit ${BOLD}.angsheng/settings.json${NC} with your API key (if not done)"
echo "  2. Run: ${BOLD}bun run lammps${NC}  to start the interactive agent"
echo "  3. Or:  ${BOLD}bun run lammps-review <script.in>${NC}  to review a LAMMPS input"
echo ""
echo "  Useful commands:"
echo "    bun run rebuild-knowledge     Rebuild the knowledge index"
echo "    bun run test:lammps           Run test suite"
echo ""

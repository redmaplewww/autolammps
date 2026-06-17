# ============================================================================
# AutoLammps Deployment Script (Windows PowerShell)
# ============================================================================
# Usage:
#   git clone https://github.com/redmaplewww/autolammps.git
#   cd autolammps
#   .\deploy.ps1
# ============================================================================

$ErrorActionPreference = "Stop"

function Write-Info  { Write-Host "[INFO]  $_" -ForegroundColor Green }
function Write-Warn  { Write-Host "[WARN]  $_" -ForegroundColor Yellow }
function Write-Err   { Write-Host "[ERROR] $_" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "==========================================" 
Write-Host "  AutoLammps Deployment"
Write-Host "==========================================" 
Write-Host ""

# --- Step 0: Check dependencies ---------------------------------------------

Write-Info "Checking dependencies..."

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Err "git not found. Install from https://git-scm.com"
}
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Err "bun not found. Install: irm bun.sh/install.ps1 | iex"
}

$lmp = Get-Command lmp -ErrorAction SilentlyContinue
if (-not $lmp) {
    Write-Warn "LAMMPS (lmp) not found in PATH. Simulation execution will not work."
}

$python = Get-Command python3 -ErrorAction SilentlyContinue
if (-not $python) {
    $python = Get-Command python -ErrorAction SilentlyContinue
}
if (-not $python) {
    Write-Warn "python not found. Post-processing scripts may not work."
}

Write-Info "Dependencies OK."
Write-Host ""

# --- Step 1: Ensure we are in the repo root --------------------------------

if (-not (Test-Path "package.json") -or -not (Test-Path ".angsheng")) {
    Write-Err "Not in AutoLammps repo root. Run this script from the cloned repo directory."
}

$RepoRoot = (Get-Location).Path
Write-Info "Repo root: $RepoRoot"

# --- Step 2: Install npm dependencies --------------------------------------

Write-Info "Installing dependencies (bun install)..."
try {
    bun install 2>$null
} catch {
    Write-Err "bun install failed: $_"
}
Write-Info "Dependencies installed."
Write-Host ""

# --- Step 3: Decompress knowledge index ------------------------------------

$CacheDir = ".angsheng/cache"
New-Item -ItemType Directory -Force -Path $CacheDir | Out-Null

$SqliteMain = "$CacheDir/lammps-knowledge.sqlite"
$SqliteMainGz = "$CacheDir/lammps-knowledge.sqlite.gz"
$SqliteLayered = "$CacheDir/lammps-knowledge-layered.sqlite"
$SqliteLayeredGz = "$CacheDir/lammps-knowledge-layered.sqlite.gz"
$SqlitePipeline = "$CacheDir/lammps-kb-pipeline.sqlite"
$SqlitePipelineGz = "$CacheDir/lammps-kb-pipeline.sqlite.gz"

$NeedRebuild = $false

# Main knowledge DB
if (Test-Path $SqliteMainGz) {
    Write-Info "Decompressing knowledge index (lammps-knowledge.sqlite.gz)..."
    & gzip -dk $SqliteMainGz
    $size = (Get-Item $SqliteMain).Length / 1MB
    Write-Info ("Knowledge index decompressed: {0:N1} MB" -f $size)
} elseif (Get-ChildItem "$CacheDir/lammps-knowledge.sqlite.gz.part-*" -ErrorAction SilentlyContinue) {
    Write-Info "Reassembling chunked knowledge index..."
    $parts = Get-ChildItem "$CacheDir/lammps-knowledge.sqlite.gz.part-*" | Sort-Object Name
    $outStream = [System.IO.File]::Create($SqliteMainGz)
    foreach ($p in $parts) {
        $inStream = [System.IO.File]::OpenRead($p.FullName)
        $inStream.CopyTo($outStream)
        $inStream.Close()
    }
    $outStream.Close()
    & gzip -dk $SqliteMainGz
    $size = (Get-Item $SqliteMain).Length / 1MB
    Write-Info ("Knowledge index reassembled: {0:N1} MB" -f $size)
} elseif (Test-Path $SqliteMain) {
    Write-Info "Knowledge index already exists, skipping decompression."
} else {
    Write-Warn "No compressed knowledge index found. Will rebuild from source files."
    $NeedRebuild = $true
}

# Layered DB
if (Test-Path $SqliteLayeredGz) {
    Write-Info "Decompressing layered index..."
    & gzip -dk $SqliteLayeredGz
} elseif (-not (Test-Path $SqliteLayered)) {
    Write-Warn "No layered index found (optional, non-blocking)."
}

# Pipeline DB
if (Test-Path $SqlitePipelineGz) {
    Write-Info "Decompressing KB pipeline index..."
    & gzip -dk $SqlitePipelineGz
}
Write-Host ""

# --- Step 4: Rebuild index if needed ---------------------------------------

if ($NeedRebuild) {
    Write-Info "Rebuilding knowledge index from source files..."
    Write-Info "This may take 1-3 minutes..."
    $rebuildCode = @'
        import { buildKnowledgeIndex } from "./src/utils/lammpsKnowledge/indexer.js";
        const r = await buildKnowledgeIndex();
        console.log("Indexed:", r.indexedFiles, "files,", r.indexedChunks, "chunks");
        if (r.indexedFiles < 100) {
            console.error("WARNING: Unexpectedly few files indexed.");
            process.exit(1);
        }
'@
    try {
        $rebuildCode | bun -e
    } catch {
        Write-Err "Index rebuild failed: $_"
    }
    Write-Info "Knowledge index rebuilt successfully."
} else {
    Write-Info "Skipping index rebuild (using shipped index)."
    Write-Info "To force rebuild: bun run rebuild-knowledge"
}
Write-Host ""

# --- Step 5: Check API configuration ---------------------------------------

$SettingsFile = ".angsheng/settings.json"
$SettingsLocal = ".angsheng/settings.local.json"
$ApiConfigured = $false

foreach ($f in @($SettingsFile, $SettingsLocal)) {
    if (Test-Path $f) {
        $content = Get-Content $f -Raw
        if ($content -match 'ANTHROPIC_API_KEY.*[a-zA-Z0-9]{20}|OPENAI_API_KEY.*[a-zA-Z0-9]{20}|DEEPSEEK_API_KEY.*[a-zA-Z0-9]{20}') {
            $ApiConfigured = $true
            break
        }
    }
}

if ($ApiConfigured) {
    Write-Info "API key detected in settings."
} else {
    Write-Warn "No API key found in settings files."
    Write-Warn "Edit .angsheng/settings.json and set your API key."
    Write-Host ""
    Write-Host '    "env": {'
    Write-Host '        "ANTHROPIC_API_KEY": "your-key-here"'
    Write-Host '    }'
    Write-Host ""
}
Write-Host ""

# --- Done ------------------------------------------------------------------

Write-Host "==========================================" 
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "==========================================" 
Write-Host ""
Write-Host "  Next steps:"
Write-Host ""
Write-Host "  1. Edit .angsheng\settings.json with your API key (if not done)"
Write-Host "  2. Run: bun run lammps  to start the interactive agent"
Write-Host ""
Write-Host "  Useful commands:"
Write-Host "    bun run rebuild-knowledge     Rebuild the knowledge index"
Write-Host "    bun run test:lammps           Run test suite"
Write-Host ""

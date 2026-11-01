# ============================================
# ECHO - DEVELOPMENT SCRIPT
# Starts backend and frontend in separate terminals.
# ============================================

$ErrorActionPreference = "Stop"

# --------------------------------------------
# PROJECT PATHS
# --------------------------------------------

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$BackendPath = $ProjectRoot
$BackendApp = Join-Path $BackendPath "app\main.py"
$FrontendPath = Join-Path $ProjectRoot "frontend"

$VenvPython = Join-Path $ProjectRoot ".venv\Scripts\python.exe"
$NodeModules = Join-Path $FrontendPath "node_modules"

$DataPath = Join-Path $ProjectRoot "data"
$MediaPath = Join-Path $DataPath "media"

# --------------------------------------------
# HELPER FUNCTIONS
# --------------------------------------------

function Write-Step {
    param([string]$Message)

    Write-Host ""
    Write-Host ">> $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)

    Write-Host "[OK] $Message" -ForegroundColor Green
}

function ConvertTo-SafePowerShellString {
    param([string]$Value)

    return "'" + $Value.Replace("'", "''") + "'"
}

function Start-DevelopmentTerminal {
    param(
        [string]$Title,
        [string]$WorkingDirectory,
        [string]$Command
    )

    $SafeTitle = ConvertTo-SafePowerShellString $Title
    $SafeDirectory = ConvertTo-SafePowerShellString $WorkingDirectory

    $ChildScript = @"
`$Host.UI.RawUI.WindowTitle = $SafeTitle
Set-Location -LiteralPath $SafeDirectory

$Command
"@

    $EncodedCommand = [Convert]::ToBase64String(
        [Text.Encoding]::Unicode.GetBytes($ChildScript)
    )

    Start-Process `
        -FilePath $PowerShellExecutable `
        -ArgumentList @(
            "-NoExit",
            "-ExecutionPolicy",
            "Bypass",
            "-EncodedCommand",
            $EncodedCommand
        ) `
        -WorkingDirectory $WorkingDirectory
}

# --------------------------------------------
# HEADER
# --------------------------------------------

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "             ECHO - DEVELOPMENT" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# --------------------------------------------
# CHECK PROJECT STRUCTURE
# --------------------------------------------

Write-Step "Checking project structure..."

if (-not (Test-Path $BackendApp)) {
    throw "Backend entry point app/main.py was not found."
}

if (-not (Test-Path $FrontendPath)) {
    throw "Frontend directory was not found."
}

if (-not (Test-Path $FrontendPath\package.json)) {
    throw "Frontend package.json was not found."
}

Write-Success "Project structure found."

# --------------------------------------------
# CHECK PYTHON ENVIRONMENT
# --------------------------------------------

Write-Step "Checking Python environment..."

if (-not (Test-Path $VenvPython)) {
    throw "Python virtual environment not found. Run scripts/install.ps1 first."
}

& $VenvPython -c "import uvicorn"

if ($LASTEXITCODE -ne 0) {
    throw "Uvicorn is not installed in the project virtual environment. Run scripts/install.ps1."
}

Write-Success "Python environment ready."

# --------------------------------------------
# CHECK FRONTEND DEPENDENCIES
# --------------------------------------------

Write-Step "Checking frontend dependencies..."

if (-not (Test-Path $NodeModules)) {
    throw "Frontend dependencies not found. Run scripts/install.ps1 first."
}

$NpmInstallation = Get-Command npm.cmd -ErrorAction SilentlyContinue

if (-not $NpmInstallation) {
    $NpmInstallation = Get-Command npm -ErrorAction SilentlyContinue
}

if (-not $NpmInstallation) {
    throw "npm was not found. Check your Node.js installation."
}

$NpmCommand = $NpmInstallation.Source

if (-not $NpmCommand) {
    $NpmCommand = $NpmInstallation.Definition
}

Write-Success "Frontend dependencies ready."

# --------------------------------------------
# CHECK POWERSHELL EXECUTABLE
# --------------------------------------------

if ($PSVersionTable.PSEdition -eq "Core") {
    $PowerShellExecutable = Join-Path $PSHOME "pwsh.exe"
}
else {
    $PowerShellExecutable = Join-Path $PSHOME "powershell.exe"
}

if (-not (Test-Path $PowerShellExecutable)) {
    throw "Could not locate the PowerShell executable."
}

# --------------------------------------------
# PREPARE LOCAL STORAGE
# --------------------------------------------

Write-Step "Preparing local storage..."

New-Item -ItemType Directory -Force -Path $DataPath | Out-Null
New-Item -ItemType Directory -Force -Path $MediaPath | Out-Null

Write-Success "Local storage ready."

# --------------------------------------------
# START BACKEND
# --------------------------------------------

Write-Step "Starting backend..."

$SafePython = ConvertTo-SafePowerShellString $VenvPython

$BackendCommand = @"
& $SafePython -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
if (`$LASTEXITCODE -ne 0) {
    Write-Host "Backend stopped with an error." -ForegroundColor Red
}
"@

Start-DevelopmentTerminal `
    -Title "ECHO - Backend" `
    -WorkingDirectory $BackendPath `
    -Command $BackendCommand

Write-Success "Backend terminal opened."

# --------------------------------------------
# START FRONTEND
# --------------------------------------------

Write-Step "Starting frontend..."

$SafeNpm = ConvertTo-SafePowerShellString $NpmCommand

$FrontendCommand = @"
& $SafeNpm run dev -- --host 127.0.0.1
if (`$LASTEXITCODE -ne 0) {
    Write-Host "Frontend stopped with an error." -ForegroundColor Red
}
"@

Start-DevelopmentTerminal `
    -Title "ECHO - Frontend" `
    -WorkingDirectory $FrontendPath `
    -Command $FrontendCommand

Write-Success "Frontend terminal opened."

# --------------------------------------------
# SUMMARY
# --------------------------------------------

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "       ECHO DEVELOPMENT STARTED" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

Write-Host ""
Write-Host "Frontend:"
Write-Host "  http://127.0.0.1:5173"

Write-Host ""
Write-Host "Backend:"
Write-Host "  http://127.0.0.1:8000"

Write-Host ""
Write-Host "API documentation:"
Write-Host "  http://127.0.0.1:8000/docs"

Write-Host ""
Write-Host "Keep both terminal windows open while using Echo."
Write-Host "Close them to stop the development servers."

Write-Host ""
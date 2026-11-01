# ============================================
# ECHO - INSTALLATION SCRIPT
# Installs backend and frontend dependencies.
# ============================================

$ErrorActionPreference = "Stop"

# --------------------------------------------
# PROJECT PATHS
# --------------------------------------------

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$BackendRequirements = Join-Path $ProjectRoot "requirements.txt"
$FrontendPath = Join-Path $ProjectRoot "frontend"
$FrontendPackage = Join-Path $FrontendPath "package.json"
$FrontendLock = Join-Path $FrontendPath "package-lock.json"

$VenvPath = Join-Path $ProjectRoot ".venv"
$VenvPython = Join-Path $VenvPath "Scripts\python.exe"

$DataPath = Join-Path $ProjectRoot "data"
$MediaPath = Join-Path $DataPath "media"

# --------------------------------------------
# HELPER FUNCTIONS
# --------------------------------------------

function Write-Step {
    param(
        [string]$Message
    )

    Write-Host ""
    Write-Host ">> $Message" -ForegroundColor Cyan
}

function Write-Success {
    param(
        [string]$Message
    )

    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Invoke-CheckedCommand {
    param(
        [string]$Executable,
        [string[]]$Arguments,
        [string]$ErrorMessage
    )

    & $Executable @Arguments

    if ($LASTEXITCODE -ne 0) {
        throw "$ErrorMessage (exit code: $LASTEXITCODE)"
    }
}

# --------------------------------------------
# CHECK PROJECT FILES
# --------------------------------------------

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "          ECHO - INSTALLATION" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

Write-Step "Checking project files..."

if (-not (Test-Path $BackendRequirements)) {
    throw "requirements.txt was not found in the project root."
}

if (-not (Test-Path $FrontendPackage)) {
    throw "frontend/package.json was not found."
}

if (-not (Test-Path $FrontendLock)) {
    throw "frontend/package-lock.json was not found. Run npm install in frontend and commit the lockfile."
}

Write-Success "Project files found."

# --------------------------------------------
# CHECK PYTHON
# --------------------------------------------

Write-Step "Checking Python installation..."

$PythonCommand = $null
$PythonArguments = @()

# Prefer the Windows Python Launcher.
$PythonLauncher = Get-Command py -ErrorAction SilentlyContinue

if ($PythonLauncher) {
    $PythonCommand = $PythonLauncher.Source

    if (-not $PythonCommand) {
        $PythonCommand = $PythonLauncher.Definition
    }

    $PythonArguments = @("-3")
}
else {
    $PythonInstallation = Get-Command python -ErrorAction SilentlyContinue

    if ($PythonInstallation) {
        $PythonCommand = $PythonInstallation.Source

        if (-not $PythonCommand) {
            $PythonCommand = $PythonInstallation.Definition
        }
    }
}

# If the virtual environment already exists,
# use its interpreter.
if (Test-Path $VenvPath) {
    if (-not (Test-Path $VenvPython)) {
        throw "The existing .venv folder is incomplete. Remove it manually and run the installer again."
    }

    $PythonCommand = $VenvPython
    $PythonArguments = @()
}

if (-not $PythonCommand) {
    throw "Python was not found. Install Python 3.10 or newer."
}

$PythonVersionText = & $PythonCommand @PythonArguments -c "import sys; print('.'.join(map(str, sys.version_info[:3])))"

if ($LASTEXITCODE -ne 0) {
    throw "Could not determine the Python version."
}

$PythonVersion = [version]$PythonVersionText.Trim()

if ($PythonVersion -lt [version]"3.10") {
    throw "Python 3.10 or newer is required. Found: $PythonVersion"
}

Write-Success "Python $PythonVersion detected."

# --------------------------------------------
# CREATE VIRTUAL ENVIRONMENT
# --------------------------------------------

Write-Step "Preparing Python virtual environment..."

if (-not (Test-Path $VenvPython)) {

    Write-Host "Creating .venv..."

    Invoke-CheckedCommand `
        -Executable $PythonCommand `
        -Arguments ($PythonArguments + @("-m", "venv", $VenvPath)) `
        -ErrorMessage "Failed to create the Python virtual environment."

    if (-not (Test-Path $VenvPython)) {
        throw "The virtual environment was not created correctly."
    }
}

Write-Success "Virtual environment ready."

# --------------------------------------------
# INSTALL PYTHON DEPENDENCIES
# --------------------------------------------

Write-Step "Installing backend dependencies..."

Invoke-CheckedCommand `
    -Executable $VenvPython `
    -Arguments @("-m", "pip", "install", "--upgrade", "pip") `
    -ErrorMessage "Failed to upgrade pip."

Invoke-CheckedCommand `
    -Executable $VenvPython `
    -Arguments @("-m", "pip", "install", "-r", $BackendRequirements) `
    -ErrorMessage "Failed to install backend dependencies."

Write-Success "Backend dependencies installed."

# --------------------------------------------
# CREATE DATA DIRECTORIES
# --------------------------------------------

Write-Step "Preparing local data directories..."

New-Item -ItemType Directory -Force -Path $DataPath | Out-Null
New-Item -ItemType Directory -Force -Path $MediaPath | Out-Null

Write-Success "Data directories ready."

# --------------------------------------------
# CHECK NODE.JS
# --------------------------------------------

Write-Step "Checking Node.js installation..."

$MinimumNodeVersion = [version]"22.22.0"

$NodeInstallation = Get-Command node -ErrorAction SilentlyContinue

if (-not $NodeInstallation) {
    throw "Node.js was not found. Install Node.js 22.22.0 or newer."
}

$NodeCommand = $NodeInstallation.Source

if (-not $NodeCommand) {
    $NodeCommand = $NodeInstallation.Definition
}

$NodeVersionText = & $NodeCommand --version

if ($LASTEXITCODE -ne 0) {
    throw "Could not determine the Node.js version."
}

$NodeVersion = [version]($NodeVersionText.Trim() -replace "^v", "")

if ($NodeVersion -lt $MinimumNodeVersion) {
    throw "Unsupported Node.js version: $NodeVersion. Use Node.js $MinimumNodeVersion or newer."
}

Write-Success "Node.js $NodeVersion detected."

# --------------------------------------------
# CHECK NPM
# --------------------------------------------

$NpmInstallation = Get-Command npm.cmd -ErrorAction SilentlyContinue

if (-not $NpmInstallation) {
    $NpmInstallation = Get-Command npm -ErrorAction SilentlyContinue
}

if (-not $NpmInstallation) {
    throw "npm was not found. Reinstall Node.js with npm included."
}

$NpmCommand = $NpmInstallation.Source

if (-not $NpmCommand) {
    $NpmCommand = $NpmInstallation.Definition
}

$NpmVersionText = & $NpmCommand --version

if ($LASTEXITCODE -ne 0) {
    throw "Could not determine the npm version."
}

Write-Success "npm $NpmVersionText detected."

# --------------------------------------------
# INSTALL FRONTEND DEPENDENCIES
# --------------------------------------------

Write-Step "Installing frontend dependencies..."

Push-Location $FrontendPath

try {
    Invoke-CheckedCommand `
        -Executable $NpmCommand `
        -Arguments @("ci") `
        -ErrorMessage "Failed to install frontend dependencies."
}
finally {
    Pop-Location
}

Write-Success "Frontend dependencies installed."

# --------------------------------------------
# INSTALLATION SUMMARY
# --------------------------------------------

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "       ECHO INSTALLATION COMPLETED" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

Write-Host ""
Write-Host "Backend:"
Write-Host "  Python environment: .venv"
Write-Host "  Dependencies: installed"

Write-Host ""
Write-Host "Frontend:"
Write-Host "  Dependencies: installed"

Write-Host ""
Write-Host "Local storage:"
Write-Host "  Database directory: data/"
Write-Host "  Media directory: data/media/"

Write-Host ""
Write-Host "Next step: run scripts/dev.ps1 to start Echo."

Write-Host ""
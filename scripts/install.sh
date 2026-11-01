
#!/usr/bin/env bash

# ============================================
# ECHO - INSTALLATION SCRIPT
# Installs backend and frontend dependencies.
# Supported on macOS and Linux.
# ============================================

set -Eeuo pipefail

# --------------------------------------------
# PROJECT PATHS
# --------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BACKEND_REQUIREMENTS="$PROJECT_ROOT/requirements.txt"
FRONTEND_PATH="$PROJECT_ROOT/frontend"
FRONTEND_PACKAGE="$FRONTEND_PATH/package.json"
FRONTEND_LOCK="$FRONTEND_PATH/package-lock.json"

VENV_PATH="$PROJECT_ROOT/.venv"
VENV_PYTHON="$VENV_PATH/bin/python"

DATA_PATH="$PROJECT_ROOT/data"
MEDIA_PATH="$DATA_PATH/media"

MINIMUM_PYTHON_VERSION="3.10"
MINIMUM_NODE_MAJOR=22
MINIMUM_NODE_MINOR=22
MINIMUM_NODE_VERSION="22.22.0"

# --------------------------------------------
# HELPER FUNCTIONS
# --------------------------------------------

write_step() {
    printf '\n>> %s\n' "$1"
}

write_success() {
    printf '[OK] %s\n' "$1"
}

fail() {
    printf '\n[ERROR] %s\n' "$1" >&2
    exit 1
}

# --------------------------------------------
# HEADER
# --------------------------------------------

printf '\n============================================\n'
printf '          ECHO - INSTALLATION\n'
printf '============================================\n'

# --------------------------------------------
# CHECK PROJECT FILES
# --------------------------------------------

write_step "Checking project files..."

[[ -f "$BACKEND_REQUIREMENTS" ]] || fail "requirements.txt was not found in the project root."
[[ -f "$FRONTEND_PACKAGE" ]] || fail "frontend/package.json was not found."
[[ -f "$FRONTEND_LOCK" ]] || fail "frontend/package-lock.json was not found. Run npm install in frontend and commit the lockfile."

write_success "Project files found."

# --------------------------------------------
# CHECK PYTHON
# --------------------------------------------

write_step "Checking Python installation..."

if [[ -x "$VENV_PYTHON" ]]; then
    PYTHON_COMMAND="$VENV_PYTHON"
elif [[ -d "$VENV_PATH" ]]; then
    fail "The existing .venv folder is incomplete. Remove it manually and run the installer again."
elif command -v python3 >/dev/null 2>&1; then
    PYTHON_COMMAND="$(command -v python3)"
else
    fail "Python 3 was not found. Install Python $MINIMUM_PYTHON_VERSION or newer."
fi

PYTHON_VERSION_TEXT="$("$PYTHON_COMMAND" -c 'import sys; print(".".join(map(str, sys.version_info[:3])))')" \
    || fail "Could not determine the Python version."

PYTHON_VERSION_OK="$("$PYTHON_COMMAND" -c 'import sys; print(int(sys.version_info >= (3, 10)))')" \
    || fail "Could not validate the Python version."

[[ "$PYTHON_VERSION_OK" == "1" ]] \
    || fail "Python $MINIMUM_PYTHON_VERSION or newer is required. Found: $PYTHON_VERSION_TEXT"

write_success "Python $PYTHON_VERSION_TEXT detected."

# --------------------------------------------
# CREATE VIRTUAL ENVIRONMENT
# --------------------------------------------

write_step "Preparing Python virtual environment..."

if [[ ! -x "$VENV_PYTHON" ]]; then
    printf 'Creating .venv...\n'
    "$PYTHON_COMMAND" -m venv "$VENV_PATH" \
        || fail "Failed to create the Python virtual environment."
fi

[[ -x "$VENV_PYTHON" ]] || fail "The virtual environment was not created correctly."

write_success "Virtual environment ready."

# --------------------------------------------
# INSTALL PYTHON DEPENDENCIES
# --------------------------------------------

write_step "Installing backend dependencies..."

"$VENV_PYTHON" -m pip install --upgrade pip \
    || fail "Failed to upgrade pip."

"$VENV_PYTHON" -m pip install -r "$BACKEND_REQUIREMENTS" \
    || fail "Failed to install backend dependencies."

write_success "Backend dependencies installed."

# --------------------------------------------
# CREATE DATA DIRECTORIES
# --------------------------------------------

write_step "Preparing local data directories..."

mkdir -p "$DATA_PATH" "$MEDIA_PATH" \
    || fail "Failed to create local data directories."

write_success "Data directories ready."

# --------------------------------------------
# CHECK NODE.JS
# --------------------------------------------

write_step "Checking Node.js installation..."

if ! command -v node >/dev/null 2>&1; then
    fail "Node.js was not found. Install Node.js $MINIMUM_NODE_VERSION or newer."
fi

NODE_VERSION_TEXT="$(node --version)" \
    || fail "Could not determine the Node.js version."

NODE_VERSION="${NODE_VERSION_TEXT#v}"

NODE_MAJOR="${NODE_VERSION%%.*}"
NODE_REMAINDER="${NODE_VERSION#*.}"
NODE_MINOR="${NODE_REMAINDER%%.*}"

if [[ ! "$NODE_MAJOR" =~ ^[0-9]+$ || ! "$NODE_MINOR" =~ ^[0-9]+$ ]]; then
    fail "Could not parse the Node.js version: $NODE_VERSION_TEXT"
fi

if (( NODE_MAJOR < MINIMUM_NODE_MAJOR )) || \
   (( NODE_MAJOR == MINIMUM_NODE_MAJOR && NODE_MINOR < MINIMUM_NODE_MINOR )); then
    fail "Unsupported Node.js version: $NODE_VERSION_TEXT. Use Node.js $MINIMUM_NODE_VERSION or newer."
fi

write_success "Node.js $NODE_VERSION_TEXT detected."

# --------------------------------------------
# CHECK NPM
# --------------------------------------------

write_step "Checking npm installation..."

if ! command -v npm >/dev/null 2>&1; then
    fail "npm was not found. Reinstall Node.js with npm included."
fi

NPM_VERSION_TEXT="$(npm --version)" \
    || fail "Could not determine the npm version."

write_success "npm $NPM_VERSION_TEXT detected."

# --------------------------------------------
# INSTALL FRONTEND DEPENDENCIES
# --------------------------------------------

write_step "Installing frontend dependencies..."

(
    cd "$FRONTEND_PATH"
    npm ci
) || fail "Failed to install frontend dependencies."

write_success "Frontend dependencies installed."

# --------------------------------------------
# INSTALLATION SUMMARY
# --------------------------------------------

printf '\n============================================\n'
printf '       ECHO INSTALLATION COMPLETED\n'
printf '============================================\n'

printf '\nBackend:\n'
printf '  Python environment: .venv\n'
printf '  Dependencies: installed\n'

printf '\nFrontend:\n'
printf '  Dependencies: installed\n'

printf '\nLocal storage:\n'
printf '  Database directory: data/\n'
printf '  Media directory: data/media/\n'

printf '\nNext step: run scripts/dev.sh to start Echo.\n\n'

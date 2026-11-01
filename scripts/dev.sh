
#!/usr/bin/env bash

# ============================================
# ECHO - DEVELOPMENT SCRIPT
# Starts backend and frontend in separate terminals.
# Supported on macOS and Linux.
# ============================================

set -Eeuo pipefail

# --------------------------------------------
# PROJECT PATHS
# --------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BACKEND_APP="$PROJECT_ROOT/app/main.py"
FRONTEND_PATH="$PROJECT_ROOT/frontend"
FRONTEND_PACKAGE="$FRONTEND_PATH/package.json"
VENV_PYTHON="$PROJECT_ROOT/.venv/bin/python"
NODE_MODULES="$FRONTEND_PATH/node_modules"

DATA_PATH="$PROJECT_ROOT/data"
MEDIA_PATH="$DATA_PATH/media"

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

# Keeps the terminal open after the server stops.
make_terminal_command() {
    local working_directory="$1"
    local command="$2"
    local quoted_directory

    printf -v quoted_directory '%q' "$working_directory"

    printf 'cd %s && %s; status=$?; printf "\\n[Process stopped with exit code %%s]\\n" "$status"; printf "Press Enter to close this window..."; read -r _' \
        "$quoted_directory" "$command"
}

# --------------------------------------------
# MACOS TERMINAL
# --------------------------------------------

start_macos_terminal() {
    local command="$1"

    osascript - "$command" <<'APPLESCRIPT'
on run argv
    set commandText to item 1 of argv

    tell application "Terminal"
        activate
        set newWindow to make new window
        do script commandText in selected tab of newWindow
    end tell
end run
APPLESCRIPT
}

# --------------------------------------------
# LINUX TERMINAL
# --------------------------------------------

start_linux_terminal() {
    local title="$1"
    local command="$2"
    local quoted_command

    if command -v gnome-terminal >/dev/null 2>&1; then
        gnome-terminal --title="$title" -- bash -lc "$command"

    elif command -v konsole >/dev/null 2>&1; then
        konsole --new-window -p "tabtitle=$title" -e bash -lc "$command"

    elif command -v xfce4-terminal >/dev/null 2>&1; then
        printf -v quoted_command '%q' "$command"
        xfce4-terminal --title="$title" --hold --command="bash -lc $quoted_command"

    elif command -v x-terminal-emulator >/dev/null 2>&1; then
        x-terminal-emulator -e bash -lc "$command"

    elif command -v kitty >/dev/null 2>&1; then
        kitty --title "$title" bash -lc "$command"

    elif command -v alacritty >/dev/null 2>&1; then
        alacritty --title "$title" -e bash -lc "$command"

    elif command -v xterm >/dev/null 2>&1; then
        xterm -T "$title" -e bash -lc "$command"

    else
        fail "No supported terminal emulator found. Install GNOME Terminal, Konsole, XFCE Terminal, xterm, Kitty or Alacritty."
    fi
}

# --------------------------------------------
# START DEVELOPMENT TERMINAL
# --------------------------------------------

start_development_terminal() {
    local title="$1"
    local working_directory="$2"
    local command="$3"
    local terminal_command

    terminal_command="$(make_terminal_command "$working_directory" "$command")"

    case "$(uname -s)" in
        Darwin)
            start_macos_terminal "$terminal_command" \
                || fail "Could not open Terminal for $title. Check macOS Automation permissions and allow Terminal control."
            ;;

        Linux)
            start_linux_terminal "$title" "$terminal_command" \
                || fail "Could not open a terminal window for $title."
            ;;

        *)
            fail "Unsupported operating system: $(uname -s). Use macOS or Linux."
            ;;
    esac
}

# --------------------------------------------
# HEADER
# --------------------------------------------

printf '\n============================================\n'
printf '             ECHO - DEVELOPMENT\n'
printf '============================================\n'

# --------------------------------------------
# CHECK PROJECT STRUCTURE
# --------------------------------------------

write_step "Checking project structure..."

[[ -f "$BACKEND_APP" ]] || fail "Backend entry point app/main.py was not found."
[[ -d "$FRONTEND_PATH" ]] || fail "Frontend directory was not found."
[[ -f "$FRONTEND_PACKAGE" ]] || fail "Frontend package.json was not found."

write_success "Project structure found."

# --------------------------------------------
# CHECK PYTHON ENVIRONMENT
# --------------------------------------------

write_step "Checking Python environment..."

[[ -x "$VENV_PYTHON" ]] || fail "Python virtual environment not found. Run scripts/install.sh first."

"$VENV_PYTHON" -c 'import uvicorn' \
    || fail "Uvicorn is not installed in the project virtual environment. Run scripts/install.sh."

write_success "Python environment ready."

# --------------------------------------------
# CHECK FRONTEND DEPENDENCIES
# --------------------------------------------

write_step "Checking frontend dependencies..."

[[ -d "$NODE_MODULES" ]] || fail "Frontend dependencies not found. Run scripts/install.sh first."

command -v node >/dev/null 2>&1 \
    || fail "Node.js was not found. Install Node.js $MINIMUM_NODE_VERSION or newer."

command -v npm >/dev/null 2>&1 \
    || fail "npm was not found. Reinstall Node.js with npm included."

NODE_VERSION_TEXT="$(node --version)" \
    || fail "Could not determine the Node.js version."

NODE_VERSION="${NODE_VERSION_TEXT#v}"
NODE_MAJOR="${NODE_VERSION%%.*}"
NODE_REMAINDER="${NODE_VERSION#*.}"
NODE_MINOR="${NODE_REMAINDER%%.*}"

[[ "$NODE_MAJOR" =~ ^[0-9]+$ && "$NODE_MINOR" =~ ^[0-9]+$ ]] \
    || fail "Could not parse the Node.js version: $NODE_VERSION_TEXT"

if (( NODE_MAJOR < MINIMUM_NODE_MAJOR )) || \
   (( NODE_MAJOR == MINIMUM_NODE_MAJOR && NODE_MINOR < MINIMUM_NODE_MINOR )); then
    fail "Unsupported Node.js version: $NODE_VERSION_TEXT. Use Node.js $MINIMUM_NODE_VERSION or newer."
fi

NPM_COMMAND="$(command -v npm)"

NPM_VERSION_TEXT="$(npm --version)" \
    || fail "Could not determine the npm version."

write_success "Node.js $NODE_VERSION_TEXT and npm $NPM_VERSION_TEXT detected."
write_success "Frontend dependencies ready."

# --------------------------------------------
# PREPARE LOCAL STORAGE
# --------------------------------------------

write_step "Preparing local storage..."

mkdir -p "$DATA_PATH" "$MEDIA_PATH" \
    || fail "Failed to create local data directories."

write_success "Local storage ready."

# --------------------------------------------
# START BACKEND
# --------------------------------------------

write_step "Starting backend..."

BACKEND_COMMAND="$(printf '%q' "$VENV_PYTHON") -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

start_development_terminal \
    "ECHO - Backend" \
    "$PROJECT_ROOT" \
    "$BACKEND_COMMAND"

write_success "Backend terminal opened."

# --------------------------------------------
# START FRONTEND
# --------------------------------------------

write_step "Starting frontend..."

FRONTEND_COMMAND="$(printf '%q' "$NPM_COMMAND") run dev -- --host 127.0.0.1"

start_development_terminal \
    "ECHO - Frontend" \
    "$FRONTEND_PATH" \
    "$FRONTEND_COMMAND"

write_success "Frontend terminal opened."

# --------------------------------------------
# SUMMARY
# --------------------------------------------

printf '\n============================================\n'
printf '       ECHO DEVELOPMENT STARTED\n'
printf '============================================\n'

printf '\nFrontend:\n'
printf '  http://127.0.0.1:5173\n'

printf '\nBackend:\n'
printf '  http://127.0.0.1:8000\n'

printf '\nAPI documentation:\n'
printf '  http://127.0.0.1:8000/docs\n'

printf '\nKeep both terminal windows open while using Echo.\n'
printf 'Close them to stop the development servers.\n\n'

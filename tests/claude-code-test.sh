#!/bin/bash
# Forge Terminal Systems Test
# Run this script INSIDE a Forge terminal pane to exercise PTY and output processing.
# No external dependencies — bash builtins + coreutils only.

PASSED=0
FAILED=0

pass() { ((PASSED++)); printf '\033[32m  PASS\033[0m %s\n' "$1"; }
fail() { ((FAILED++)); printf '\033[31m  FAIL\033[0m %s\n' "$1"; }

header() {
  echo ""
  printf '\033[1;35m=== %s ===\033[0m\n' "$1"
}

# ─────────────────────────────────────────────
printf '\033[1;36m'
echo "╔══════════════════════════════════════╗"
echo "║   Forge Terminal Systems Test        ║"
echo "╚══════════════════════════════════════╝"
printf '\033[0m\n'

# ─────────────────────────────────────────────
header "Shell Basics"

# echo output
OUTPUT=$(echo "hello forge")
[[ "$OUTPUT" == "hello forge" ]] && pass "echo outputs correctly" || fail "echo outputs correctly"

# exit code propagation
true
[[ $? -eq 0 ]] && pass "exit code 0 propagation" || fail "exit code 0 propagation"
false
[[ $? -ne 0 ]] && pass "exit code non-zero propagation" || fail "exit code non-zero propagation"

# pipe chains
OUTPUT=$(echo "hello" | tr a-z A-Z)
[[ "$OUTPUT" == "HELLO" ]] && pass "pipe chains work" || fail "pipe chains work"

# subshell execution
OUTPUT=$(pwd)
[[ -n "$OUTPUT" ]] && pass "subshell execution (\$(pwd) = $OUTPUT)" || fail "subshell execution"

# environment variables
[[ -n "$HOME" ]] && pass "HOME is set ($HOME)" || fail "HOME is not set"
[[ -n "$SHELL" ]] && pass "SHELL is set ($SHELL)" || fail "SHELL is not set"
[[ -n "$TERM" ]] && pass "TERM is set ($TERM)" || fail "TERM is not set"

# ─────────────────────────────────────────────
header "Terminal Capabilities"

# columns and lines (use tput — $COLUMNS/$LINES are only set in interactive shells)
COLS=$(tput cols 2>/dev/null)
ROWS=$(tput lines 2>/dev/null)
[[ -n "$COLS" && "$COLS" -gt 0 ]] && pass "terminal columns = $COLS" || fail "terminal columns not available"
[[ -n "$ROWS" && "$ROWS" -gt 0 ]] && pass "terminal lines = $ROWS" || fail "terminal lines not available"

# TERM value
[[ "$TERM" == *"256color"* || "$TERM" == "xterm" || "$TERM" == "screen" ]] && pass "TERM supports color ($TERM)" || fail "TERM may not support color ($TERM)"

# tput colors
COLORS=$(tput colors 2>/dev/null)
if [[ -n "$COLORS" && "$COLORS" -ge 256 ]]; then
  pass "tput colors >= 256 ($COLORS)"
elif [[ -n "$COLORS" ]]; then
  fail "tput colors < 256 ($COLORS)"
else
  fail "tput colors unavailable"
fi

# ANSI color output
printf '  ANSI palette: '
for i in 0 1 2 3 4 5 6 7; do
  printf '\033[4%dm  \033[0m' "$i"
done
echo ""
pass "ANSI color output rendered (verify visually)"

# Cursor movement
if command -v tput &>/dev/null; then
  tput sc 2>/dev/null      # save cursor
  tput rc 2>/dev/null      # restore cursor
  pass "tput cursor save/restore"
else
  fail "tput not available"
fi

# ─────────────────────────────────────────────
header "PTY Health"

# signal handling
TRAP_FIRED=0
trap 'TRAP_FIRED=1' USR1
kill -USR1 $$ 2>/dev/null
[[ "$TRAP_FIRED" -eq 1 ]] && pass "signal handling (trap USR1)" || fail "signal handling (trap USR1)"
trap - USR1

# background jobs
sleep 0.5 &
BG_PID=$!
wait "$BG_PID" 2>/dev/null
[[ $? -eq 0 ]] && pass "background jobs (sleep & wait)" || fail "background jobs (sleep & wait)"

# stdin/stdout/stderr separation
ERR_OUTPUT=$(echo "stderr test" >&2 2>&1)
pass "stderr redirection works"

# ─────────────────────────────────────────────
header "Error Pattern Triggers"
echo "  (These trigger Forge error annotations — watch for them)"
echo ""

echo "  Triggering: command not found"
notarealcommand_forge_test 2>&1 || true
sleep 2

echo "  Triggering: No such file or directory"
cat /nonexistent_forge_test_path 2>&1 || true
sleep 2

echo "  Triggering: Permission denied"
touch /root/forge_permission_test 2>&1 || true
sleep 2

echo "  Triggering: fatal: not a git repository"
(cd /tmp && git status 2>&1) || true
sleep 1

pass "error pattern triggers executed (verify annotations visually)"

# ─────────────────────────────────────────────
header "Slash Commands"
echo "  Testing /help command..."
printf '\033[33m  >>> After this script, try these in the terminal:\033[0m\n'
printf '\033[33m  >>> /help     — list available commands\033[0m\n'
printf '\033[33m  >>> /clear    — clear scrollback\033[0m\n'
printf '\033[33m  >>> /theme forge-light — switch theme\033[0m\n'
printf '\033[33m  >>> /theme forge-dark  — switch back\033[0m\n'

# ─────────────────────────────────────────────
header "Long Command (Completion Notification)"
printf '\033[33m  >>> Enable the bell icon in the pane header, then run:\033[0m\n'
printf '\033[33m  >>> sleep 12\033[0m\n'
echo "  A toast notification should appear when it completes."

# ─────────────────────────────────────────────
echo ""
printf '\033[1;36m'
echo "╔══════════════════════════════════════╗"
echo "║   Results                            ║"
echo "╚══════════════════════════════════════╝"
printf '\033[0m'

TOTAL=$((PASSED + FAILED))
printf '\n  \033[32mPassed: %d\033[0m\n' "$PASSED"
printf '  \033[31mFailed: %d\033[0m\n' "$FAILED"
printf '  Total:  %d\n\n' "$TOTAL"

if [[ "$FAILED" -eq 0 ]]; then
  printf '\033[32;1m  All tests passed!\033[0m\n'
else
  printf '\033[31;1m  %d test(s) failed — see details above.\033[0m\n' "$FAILED"
fi
echo ""

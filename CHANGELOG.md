# CHANGELOG

## [Unreleased]

---

## v0.9.0 — Polish and Release Readiness (2026-04-04)

### Added
- Error boundaries on all major component trees to prevent full-app crashes from isolated failures
- Accessibility pass: ARIA roles and keyboard navigation for terminal tabs and command palette
- Release workflow: GitHub Actions for building and packaging the Tauri app
- Desktop icon set (macOS `.icns`, Windows `.ico`, Linux `.png`)

### Fixed
- TypeScript build errors introduced in Phase 8 integration

---

## v0.8.5 — Terminal Intelligence (2026-04)

### Added
- Terminal search (Ctrl+F) via xterm.js search addon
- Ghost text suggestions in the terminal input
- Error annotations surfaced from PTY output
- Completion notifications for long-running commands

---

## v0.8.0 — Tabs and Mascot (2026-04)

### Added
- Tab bar supporting multiple terminal sessions in a single window
- Ember mascot (animated SVG) in the sidebar
- Agent output panel for viewing CAST agent activity
- App icon for macOS and Linux

### Changed
- Theme system rebuilt from scratch — removed legacy CSS variables, consolidated to fire palette
- Inactive tabs now use `visibility: hidden` to prevent xterm.js blank-terminal bug on tab switch

---

## v0.7.0 — CAST Integration and Theme Enhancements (2026-04)

### Added
- CAST event integration: Forge emits and receives CAST observability events
- SVG flame logo and ambient glow effects in the sidebar
- Live agent feed panel showing active CAST agent activity
- Fire palette extended with ambient glow token

### Fixed
- Replaced hardcoded blue chrome with fire palette across sidebar, badges, and pane header

---

## v0.6.0 — Theming and Settings (2026-04)

### Added
- Settings panel with font size, opacity, and theme controls
- Flame mascot SVG in the sidebar
- `forge-dark` theme as the default, replacing the system default

---

## v0.5.0 — Command Palette (2026-04)

### Added
- Command palette (Cmd+K) powered by `cmdk`
- Command registry for registering and dispatching named actions
- Session switcher accessible from the command palette

---

## v0.4.0 — Status Bar and Git (2026-04)

### Added
- Status bar showing git branch, CWD, and shell process info
- Git status integration via `git.rs` backend module
- CWD tracking per session via `cwd.rs`
- Info panel and shortcut hint overlay

### Fixed
- Infinite re-render loop from unstable Zustand selectors in `PaneHeader`

---

## v0.3.0 — Claude Code Awareness (2026-04)

### Added
- Claude Code detection: Forge identifies when a Claude Code session is running in a PTY
- Task awareness UI: surfaces active task name and status from Claude Code output
- Hook mounts for CAST integration

---

## v0.2.0 — Multi-Pane Layout (2026-04)

### Added
- Multi-pane terminal layout using `react-resizable-panels`
- Independent session management per pane
- Keyboard navigation between panes (Alt+Arrow)

### Fixed
- Blank screen on load caused by wrong `react-resizable-panels` API usage
- Shell numbering after pane split
- Sidebar expand button when sidebar is collapsed

---

## v0.1.0 — Foundation (2026-04)

### Added
- Tauri v2 scaffold with Vite + React 19 frontend
- PTY backend via `portable-pty` Rust crate: spawn, write, resize
- xterm.js terminal renderer wired to PTY output stream
- Per-session event channels for PTY output (no cross-session leakage)

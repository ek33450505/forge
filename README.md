# Forge

A developer terminal built around Claude Code.

Forge is a native macOS terminal emulator where Claude Code is a first-class citizen -- not a plugin bolted onto an existing editor, but an application designed from the ground up for AI-native development workflows.

<!-- Screenshots coming after systems test -->

## Features

- **Multi-tab + split pane terminal** -- browser-style tabs (Cmd+T) with horizontal (Cmd+D) and vertical (Cmd+Shift+D) splits
- **Claude Code detection** -- auto-detects Claude sessions with visual indicators and dedicated accent color
- **Command palette** (Cmd+K) -- fuzzy search across commands and sessions
- **Terminal output search** (Cmd+F) -- incremental search with regex support
- **Ghost-text suggestions** -- command suggestions from shell history
- **Inline error annotations** -- detects common errors and surfaces fix suggestions
- **Completion notifications** -- alerts when long-running commands finish in background tabs
- **6 built-in themes** -- fire-colored default (Forge Dark), plus Ember, Moonlight, Arctic, Solarized, High Contrast
- **CAST integration** (optional) -- agent activity feed, token stats bar, session monitoring
- **Agent output panel** (Cmd+Shift+O) -- dedicated panel for Claude agent output
- **Keyboard-first design** -- 20+ shortcuts for all core actions
- **Per-pane error boundaries** -- a crash in one pane does not affect others
- **Settings panel** (Cmd+,) -- theme selection, font family, font size

## Installation

### From source

```bash
git clone https://github.com/ek33450505/forge.git
cd forge
npm install
npx tauri build
```

The built `.app` bundle will be in `src-tauri/target/release/bundle/macos/`.

### Homebrew (coming soon)

```bash
brew install --cask ek33450505/forge/forge
```

### GitHub Releases

Download the latest `.dmg` from the [Releases page](https://github.com/ek33450505/forge/releases). This is an ad-hoc signed build -- right-click and select Open to bypass macOS Gatekeeper.

## Development

### Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) 20+
- [Tauri CLI v2](https://v2.tauri.app/) (`cargo install tauri-cli --version '^2'`)
- macOS (primary target)

### Setup

```bash
git clone https://github.com/ek33450505/forge.git
cd forge
npm install
npx tauri dev
```

### Commands

| Command | Purpose |
|---|---|
| `npx tauri dev` | Run in development mode |
| `npx tauri build` | Build .app bundle |
| `npm run type-check` | TypeScript type checking |
| `npm run test` | Run frontend tests |
| `cargo check` | Rust compilation check (from src-tauri/) |
| `cargo test` | Rust tests (from src-tauri/) |

## Architecture

```
+-----------------------------------------------------------+
|  Forge Application                                        |
|                                                           |
|  React Frontend (WebView / Vite)                          |
|  +-- TerminalPane       (xterm.js + xterm-addon-fit)      |
|  +-- SessionSidebar     (session list, type badges)       |
|  +-- PaneLayout         (react-resizable-panels)          |
|  +-- TabBar             (browser-style tabs)              |
|  +-- CommandPalette     (cmdk)                            |
|  +-- StatusBar          (git, dir, session, CAST)         |
|  +-- AgentFeed          (CAST-only, optional)             |
|  +-- SettingsPanel      (theme, font, keybindings)        |
|  +-- ErrorBoundary      (per-pane crash isolation)        |
|                                                           |
|  Tauri IPC (typed invoke + events)                        |
|  +-- pty_create / pty_write / pty_resize / pty_kill       |
|  +-- session_list / session_create / session_close        |
|  +-- git_status / cwd_watch                               |
|  +-- cast_detect / cast_db_query                          |
|  +-- config_read / config_write                           |
|                                                           |
|  Rust Backend (src-tauri/)                                |
|  +-- pty.rs             (portable-pty)                    |
|  +-- session.rs         (session registry, Arc<Mutex>)    |
|  +-- git.rs             (git2 crate or shell out)         |
|  +-- cast.rs            (rusqlite reader, optional)       |
|  +-- config.rs          (serde + dirs crate)              |
|  +-- watcher.rs         (notify crate, file events)       |
+-----------------------------------------------------------+
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Cmd+T | New tab |
| Cmd+D | Split horizontal |
| Cmd+Shift+D | Split vertical |
| Cmd+W | Close active pane |
| Cmd+K | Command palette |
| Cmd+F | Terminal search |
| Cmd+B | Toggle sidebar |
| Cmd+I | Toggle info panel |
| Cmd+/ | Toggle shortcut reference |
| Cmd+, | Open settings |
| Cmd+Shift+O | Toggle agent output panel |
| Cmd+Shift+A | Toggle CAST agent feed |
| Cmd+1 through Cmd+9 | Switch to pane by index |

## Tech Stack

- **Runtime:** Tauri v2 (Rust backend + WebView frontend)
- **Frontend:** React 19, TypeScript, Vite 6
- **Terminal:** portable-pty (real PTY), xterm.js (emulation)
- **State:** Zustand 5
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **UI Components:** cmdk, react-resizable-panels, Radix UI

## License

MIT

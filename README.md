# Forge

A developer terminal built around Claude Code.

Forge is a native macOS terminal emulator where Claude Code is a first-class citizen — not a plugin bolted onto an existing editor, but an application designed from the ground up for AI-native development workflows.

## Status

Phase 1 — Foundation. Single terminal pane with real PTY.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Forge Application                                       │
│                                                         │
│  React Frontend (WebView / Vite)                        │
│  ├── TerminalPane       (xterm.js + xterm-addon-fit)    │
│  ├── SessionSidebar     (session list, type badges)     │
│  ├── PaneLayout         (react-resizable-panels)        │
│  ├── CommandPalette     (cmdk)                          │
│  ├── StatusBar          (git, dir, session, CAST)       │
│  ├── AgentFeed          (CAST-only, optional)           │
│  └── SettingsPanel      (theme, font, keybindings)      │
│                                                         │
│  Tauri IPC (typed invoke + events)                      │
│  ├── pty_create / pty_write / pty_resize                │
│  ├── session_list / session_create / session_close      │
│  ├── git_status / cwd_watch                             │
│  ├── cast_detect / cast_db_query                        │
│  └── config_read / config_write                         │
│                                                         │
│  Rust Backend (src-tauri/)                              │
│  ├── pty.rs             (portable-pty)                  │
│  ├── session.rs         (session registry, Arc<Mutex>)  │
│  ├── git.rs             (git2 crate or shell out)       │
│  ├── cast.rs            (rusqlite reader, optional)     │
│  ├── config.rs          (serde + dirs crate)            │
│  └── watcher.rs         (notify crate, file events)     │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Runtime:** Tauri v2 (Rust backend + WebView frontend)
- **Frontend:** React 19, TypeScript, Vite, xterm.js
- **Terminal:** portable-pty (real PTY), xterm.js (emulation)
- **State:** Zustand

## Development

### Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) 20+
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
| `cargo check` | Rust compilation check (from src-tauri/) |

## License

MIT

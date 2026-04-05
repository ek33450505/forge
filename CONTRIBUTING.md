# Contributing to Forge

Thank you for your interest in contributing to Forge — the desktop terminal emulator built around Claude Code.

## Prerequisites

- [Rust](https://rustup.rs/) 1.77.2 or later (managed via `rustup`)
- [Node.js](https://nodejs.org/) 20 or later
- [Tauri CLI v2](https://tauri.app/start/prerequisites/) — `cargo install tauri-cli --version "^2"`
- A working Claude Code installation is helpful for understanding the terminal's target use case, but not required to build or test Forge

## Development Setup

```bash
git clone https://github.com/ek33450505/forge.git
cd forge
npm install
npx tauri dev
```

`npx tauri dev` starts the Vite dev server and the Tauri Rust backend together. The app window opens automatically. Hot-reload is active for the React frontend; Rust changes trigger a backend recompile.

---

## Project Structure

```
forge/
  src/                  # React 19 frontend (TypeScript)
    components/         # UI components (terminal, tabs, sidebar, panels)
    store/              # Zustand state stores
    commands/           # Command registry and palette
    hooks/              # Custom React hooks
  src-tauri/            # Rust backend (Tauri v2)
    src/
      lib.rs            # Tauri app setup and command registration
      pty.rs            # PTY management (spawn, write, resize)
      shell.rs          # Shell detection and configuration
    tauri.conf.json     # Tauri app config (window, permissions, bundle)
    Cargo.toml          # Rust dependencies
  public/               # Static assets
  vitest.config.ts      # Vitest configuration
```

---

## Code Style

### TypeScript

- Strict mode is enabled (`tsconfig.json`). All code must pass `tsc --noEmit` without errors.
- Use named exports from component files; avoid default exports for non-page components.
- Prefer `const` functions over `function` declarations for components.
- Format with the project's existing ESLint config (`eslint.config.js`). Run `npm run lint` before committing.

### Zustand

- Use stable selectors: select individual state slices rather than the whole store object. Selecting the full store triggers re-renders on every state change and is a known source of infinite re-render loops in this codebase.

  ```ts
  // Good
  const count = useStore((s) => s.count)

  // Avoid — selects entire store, causes unnecessary re-renders
  const { count } = useStore()
  ```

- Side effects that write to the store belong in store actions, not in component `useEffect`.

### Rust (IPC handlers)

- No `unwrap()` calls in IPC command handlers (`#[tauri::command]` functions). Use `?` propagation or explicit match with a descriptive error string.
- PTY operations that can fail must return `Result<T, String>` — the string is surfaced to the frontend via Tauri's error channel.
- Keep IPC handlers thin: delegate logic to separate modules (`pty.rs`, `shell.rs`).

---

## Testing

### Frontend (Vitest)

```bash
npm run test
```

Tests live alongside source files: `src/components/Foo.tsx` -> `src/components/Foo.test.tsx`. Test behavior, not implementation — prefer `getByRole` and `getByText` over `getByTestId`.

### Rust (cargo test)

```bash
cd src-tauri
cargo test
```

Pure logic functions (shell detection, PTY argument building) should have unit tests. IPC handlers do not need unit tests but should be covered by integration or manual testing.

---

## Pull Request Process

1. Fork the repo and create a branch: `git checkout -b feat/my-feature`
2. Make your changes. Add or update tests as appropriate.
3. Run the full test suite: `npm run test` and `cd src-tauri && cargo test`
4. Verify TypeScript: `npm run build` (catches type errors in the full build)
5. Open a pull request against `main`. Fill out the pull request template.

Keep pull requests focused. One logical change per PR makes review faster and history cleaner.

---

## Commit Message Format

Use imperative mood with a semantic prefix:

```
feat: add session persistence across restarts
fix: prevent blank terminal on tab switch
test: add PTY resize handler tests
docs: update contributing prerequisites
refactor: extract shell detection into separate module
```

Commit messages should complete the sentence "If applied, this commit will..." — so "add session persistence" not "added session persistence."

### CAST-generated commits

This project is developed with CAST (Claude Agent Specialist Team), a multi-agent Claude Code workflow. Commits authored by CAST agents include a `Co-Authored-By` trailer:

```
Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
```

These commits follow the same format rules above. As a contributor, you do not need CAST to contribute — it is a development toolchain choice, not a requirement.

---

## PR Checklist

Before opening a pull request:

- [ ] `npm run test` passes
- [ ] `npm run build` passes (no TypeScript errors)
- [ ] `cd src-tauri && cargo test` passes
- [ ] No `unwrap()` calls in IPC command handlers
- [ ] Zustand selectors are stable (no full-store selects in components)
- [ ] `CHANGELOG.md` updated for any user-visible change
- [ ] PR template filled out (summary, testing steps, screenshots for UI changes)

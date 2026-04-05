# Forge Systems Test Checklist

> **Instructions:** Open Forge.app, work through each section in order, and check off items as you verify them. Note any failures with a brief description next to the item.

---

## Terminal Basics

- [ ] Launch Forge — terminal loads with shell prompt
- [ ] Type `echo hello` — output appears correctly
- [ ] Run `ls --color` — ANSI colors render
- [ ] Cursor blink works
- [ ] Resize window — terminal reflows without artifacts
- [ ] Run a long command (`find / -name "*.md" 2>/dev/null | head -20`) — scrollback works

## Tabs & Panes

- [ ] Cmd+T — new tab opens with independent session
- [ ] Click between tabs — content preserved, no blank terminals
- [ ] Cmd+D — horizontal split within tab
- [ ] Cmd+Shift+D — vertical split within tab
- [ ] Cmd+W — close active pane (or tab if last pane)
- [ ] Cmd+1/2/3 — switch between panes by index
- [ ] Middle-click tab — closes it
- [ ] Close all tabs — new default session respawns

## Sidebar

- [ ] Session list shows all sessions across all tabs
- [ ] Click session — switches to correct tab and pane
- [ ] Double-click — rename works, Enter commits, Escape cancels
- [ ] Right-click — session type menu appears
- [ ] Cmd+B — toggle sidebar collapse/expand
- [ ] Collapsed sidebar shows expand button

## Command Palette

- [ ] Cmd+K — palette opens
- [ ] Type "split" — fuzzy matches Split Horizontal/Vertical
- [ ] Execute a command — palette closes, action fires
- [ ] Escape — closes palette
- [ ] Recent commands appear at top on second open
- [ ] Session switcher — type session name, select it

## Terminal Search

- [ ] Cmd+F — search bar appears at top-right of pane
- [ ] Type search term — matches highlight in scrollback
- [ ] Enter — cycles to next match
- [ ] Shift+Enter — cycles to previous match
- [ ] Case sensitivity toggle (Aa button)
- [ ] Regex toggle (.* button)
- [ ] Escape — closes search
- [ ] Match count displays (e.g., "3 / 12")

## Ghost Text Suggestions

- [ ] Run several commands (`git status`, `npm run test`, etc.)
- [ ] Start typing a previously used command prefix
- [ ] Ghost suggestion appears (if history match exists)
- [ ] Tab — accepts suggestion
- [ ] Any other key — dismisses ghost text

## Error Annotations

- [ ] Run `cat /nonexistent` — "File or directory missing" annotation appears
- [ ] Run `notarealcommand` — "Command not found" annotation appears
- [ ] Click X on annotation — dismisses it
- [ ] Annotations cap at 3 per pane
- [ ] Annotations auto-appear within ~500ms

## Completion Notifications

- [ ] Enable bell via PaneHeader bell icon (or command palette)
- [ ] Run `sleep 12` — toast notification fires on completion
- [ ] Run `sleep 3` — no notification (below 10s threshold)

## Themes & Settings

- [ ] Cmd+, — settings panel opens
- [ ] Switch theme — terminal and chrome update immediately
- [ ] Change font size — terminal reflowed
- [ ] All 6 themes render correctly
- [ ] Close settings — Escape or click outside

## Keyboard Shortcuts Reference

- [ ] Cmd+/ — shortcut reference panel appears
- [ ] Shows all shortcuts grouped by category
- [ ] Escape — closes panel
- [ ] Click outside — closes panel

## Status Bar

- [ ] Shows current working directory
- [ ] Shows git branch when in a git repo
- [ ] Dirty indicator (dot) when uncommitted changes exist
- [ ] Session count updates correctly
- [ ] Token meter displays (may show 0)

## Claude Code Detection

- [ ] Launch `claude` in a pane
- [ ] Sidebar badge changes to "Claude" within 3 seconds
- [ ] Pane border accent changes to claude color
- [ ] Tab shows Claude badge
- [ ] Exit Claude — badge reverts to "Shell"

## CAST Integration (if CAST installed)

- [ ] Cmd+Shift+A — agent feed panel opens
- [ ] Status bar shows CAST stats
- [ ] Agent feed shows recent runs (if any)
- [ ] Feed closes with Cmd+Shift+A

## Error Boundary

- [ ] Verify `ErrorBoundary.tsx` exists and wraps panes (code inspection)

## App Identity

- [ ] Dock icon shows Forge flame (not default Tauri icon)
- [ ] Title bar shows "Forge" with flame icon
- [ ] Window title is "Forge"

---

## Results

| Field | Value |
|-------|-------|
| **Forge version** | |
| **macOS version** | |
| **Date** | |
| **Tester** | |
| **Total passed** | |
| **Total failed** | |
| **Notes** | |

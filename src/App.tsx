import { useEffect, useState, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { PaneLayout } from './components/PaneLayout';
import { SessionSidebar } from './components/SessionSidebar';
import { StatusBar } from './components/StatusBar';
import { InfoPanel } from './components/InfoPanel';
import { ToastNotifications } from './components/ToastNotifications';
import { ShortcutHints } from './components/ShortcutHints';
import { CommandPalette } from './components/CommandPalette';
import { useLayoutStore } from './store/layout';
import { useSessionStore } from './store/sessions';
import { useCommandHistoryStore } from './store/commandHistory';
import { overwriteCommand, type Command as ForgeCommand } from './lib/commands';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useProcessInspection } from './hooks/useProcessInspection';
import { useClaudeDetection } from './hooks/useClaudeDetection';
import { useCastFeed } from './hooks/useCastFeed';

let shellCounter = 0;
function nextShellName() {
  shellCounter += 1;
  return `Shell ${shellCounter}`;
}

function App() {
  const [ready, setReady] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [shortcutHintsVisible, setShortcutHintsVisible] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const initialized = useRef(false);

  const initialize = useLayoutStore((s) => s.initialize);
  const splitPane = useLayoutStore((s) => s.splitPane);
  const root = useLayoutStore((s) => s.root);
  const activePaneId = useLayoutStore((s) => s.activePaneId);
  const addSession = useSessionStore((s) => s.addSession);

  // Create first PTY session on mount (guarded against StrictMode double-mount)
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    void (async () => {
      try {
        const sessionId = await invoke<string>('pty_create', {
          shell: '/bin/zsh',
          cols: 80,
          rows: 24,
        });
        addSession({
          id: sessionId,
          name: nextShellName(),
          shell: '/bin/zsh',
          created_at: Date.now() / 1000,
        });
        const paneId = crypto.randomUUID();
        initialize(paneId, sessionId);
        setReady(true);
      } catch (err) {
        console.error('Failed to create initial PTY session:', err);
        setReady(true);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the last pane is closed, open a new default session
  useEffect(() => {
    if (!ready || root !== null) return;

    void (async () => {
      const sessionId = await invoke<string>('pty_create', {
        shell: '/bin/zsh',
        cols: 80,
        rows: 24,
      });
      addSession({
        id: sessionId,
        name: nextShellName(),
        shell: '/bin/zsh',
        created_at: Date.now() / 1000,
      });
      const paneId = crypto.randomUUID();
      initialize(paneId, sessionId);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, ready]);

  const handleSplit = useCallback(
    async (direction: 'horizontal' | 'vertical') => {
      if (!activePaneId) return;
      const sessionId = await invoke<string>('pty_create', {
        shell: '/bin/zsh',
        cols: 80,
        rows: 24,
      });
      addSession({
        id: sessionId,
        name: nextShellName(),
        shell: '/bin/zsh',
        created_at: Date.now() / 1000,
      });
      const newLeaf = splitPane(activePaneId, direction, sessionId);
      if (newLeaf) {
        useLayoutStore.getState().setActivePane(newLeaf.id);
      }
    },
    [activePaneId, addSession, splitPane],
  );

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const handleToggleInfoPanel = useCallback(() => {
    setInfoPanelOpen((prev) => !prev);
  }, []);

  const handleToggleShortcutHints = useCallback(() => {
    setShortcutHintsVisible((prev) => !prev);
  }, []);

  const handleToggleCommandPalette = useCallback(() => {
    setCommandPaletteOpen((prev) => !prev);
  }, []);

  const handleCloseCommandPalette = useCallback(() => {
    setCommandPaletteOpen(false);
  }, []);

  // Register built-in commands — use overwriteCommand for StrictMode idempotency
  useEffect(() => {
    overwriteCommand({
      id: 'new-session',
      label: 'New Session',
      group: 'Layout',
      handler: () => { void handleSplit('horizontal'); },
    });
    overwriteCommand({
      id: 'split-horizontal',
      label: 'Split Horizontal',
      group: 'Layout',
      keybind: '⌘D',
      handler: () => { void handleSplit('horizontal'); },
    });
    overwriteCommand({
      id: 'split-vertical',
      label: 'Split Vertical',
      group: 'Layout',
      keybind: '⌘⇧D',
      handler: () => { void handleSplit('vertical'); },
    });
    overwriteCommand({
      id: 'close-pane',
      label: 'Close Pane',
      group: 'Layout',
      keybind: '⌘W',
      handler: () => {
        useLayoutStore.getState().closePane(activePaneId ?? '');
      },
    });
    overwriteCommand({
      id: 'rename-session',
      label: 'Rename Session',
      group: 'Session',
      handler: () => {
        const activeSessionId = useLayoutStore
          .getState()
          .getLeaves()
          .find((l) => l.id === activePaneId)?.sessionId;
        if (!activeSessionId) return;
        const name = window.prompt('Rename session:');
        if (name) {
          useSessionStore.getState().renameSession(activeSessionId, name);
        }
      },
    });
    overwriteCommand({
      id: 'switch-theme',
      label: 'Switch Theme',
      group: 'Settings',
      handler: () => { toast.info('Themes coming in Phase 6'); },
    });
    overwriteCommand({
      id: 'open-settings',
      label: 'Open Settings',
      group: 'Settings',
      keybind: '⌘,',
      handler: () => { toast.info('Settings coming in Phase 6'); },
    });
  }, [activePaneId, handleSplit]);

  const handleExecuteCommand = useCallback(
    (cmd: ForgeCommand | { id: string; label: string; group: 'Session'; sessionId: string }) => {
      if ('handler' in cmd) {
        cmd.handler();
      }
      useCommandHistoryStore.getState().pushCommand(cmd.id);
      setCommandPaletteOpen(false);
    },
    [],
  );

  useKeyboardShortcuts(handleSplit, handleToggleSidebar, handleToggleInfoPanel, handleToggleShortcutHints, handleToggleCommandPalette);
  useProcessInspection();
  useClaudeDetection();
  useCastFeed();

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1a1a2e',
        color: '#e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Title bar */}
      <div
        style={{
          height: '28px',
          flexShrink: 0,
          backgroundColor: '#16213e',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '12px',
          fontSize: '13px',
          fontWeight: 600,
          color: '#a0a0b0',
          userSelect: 'none',
        }}
      >
        Forge
      </div>

      {/* Main content: sidebar + panes + info panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <SessionSidebar
          collapsed={sidebarCollapsed}
          onToggle={handleToggleSidebar}
        />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {ready && <PaneLayout />}
        </div>
        <InfoPanel open={infoPanelOpen} onClose={handleToggleInfoPanel} />
      </div>

      {/* Shortcut hints strip — above status bar */}
      <ShortcutHints visible={shortcutHintsVisible} />

      {/* Status bar — bottom of outer column */}
      <StatusBar onToggleInfoPanel={handleToggleInfoPanel} />

      {/* Command palette overlay */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={handleCloseCommandPalette}
        onExecute={handleExecuteCommand}
      />

      {/* Toast portal */}
      <ToastNotifications />
    </div>
  );
}

export default App;

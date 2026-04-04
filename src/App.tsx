import { useEffect, useState, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { PaneLayout } from './components/PaneLayout';
import { SessionSidebar } from './components/SessionSidebar';
import { useLayoutStore } from './store/layout';
import { useSessionStore } from './store/sessions';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

let shellCounter = 0;
function nextShellName() {
  shellCounter += 1;
  return `Shell ${shellCounter}`;
}

function App() {
  const [ready, setReady] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  useKeyboardShortcuts(handleSplit, handleToggleSidebar);

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

      {/* Main content: sidebar + panes */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <SessionSidebar
          collapsed={sidebarCollapsed}
          onToggle={handleToggleSidebar}
        />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {ready && <PaneLayout />}
        </div>
      </div>
    </div>
  );
}

export default App;

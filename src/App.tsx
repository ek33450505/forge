import { useEffect, useState, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { PaneLayout } from './components/PaneLayout';
import { SessionSidebar } from './components/SessionSidebar';
import { StatusBar } from './components/StatusBar';
import { InfoPanel } from './components/InfoPanel';
import { ToastNotifications } from './components/ToastNotifications';
import { CommandPalette } from './components/CommandPalette';
import { Flame } from './components/Flame';
import { SettingsPanel } from './components/SettingsPanel';
import { useLayoutStore } from './store/layout';
import { useSessionStore } from './store/sessions';
import { useCommandHistoryStore } from './store/commandHistory';
import { useTerminalSearchStore } from './store/terminalSearch';
import { useNotificationSettingsStore } from './store/notificationSettings';
import { overwriteCommand, type Command as ForgeCommand } from './lib/commands';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useProcessInspection } from './hooks/useProcessInspection';
import { useClaudeDetection } from './hooks/useClaudeDetection';
import { useCastFeed } from './hooks/useCastFeed';
import { useCastData } from './hooks/useCastData';
import { useCastStore } from './store/cast';
import { AgentFeed } from './components/AgentFeed';
import { TabBar } from './components/TabBar';
import { AgentOutputPanel } from './components/AgentOutputPanel';
import { useAgentOutput } from './hooks/useAgentOutput';
import { useAgentOutputStore } from './store/agentOutput';
import { useTheme } from './hooks/useTheme';
import { loadForgeConfig } from './hooks/useForgeConfig';
import { useThemeStore } from './store/theme';

let shellCounter = 0;
function nextShellName() {
  shellCounter += 1;
  return `Shell ${shellCounter}`;
}

function App() {
  // Apply CSS custom properties for the active theme
  useTheme();

  const [ready, setReady] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [shortcutRefOpen, setShortcutRefOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const initialized = useRef(false);

  const initialize = useLayoutStore((s) => s.initialize);
  const splitPane = useLayoutStore((s) => s.splitPane);
  const tabs = useLayoutStore((s) => s.tabs);
  const activePaneId = useLayoutStore((s) => s.activePaneId);
  const addSession = useSessionStore((s) => s.addSession);

  // Create first PTY session on mount (guarded against StrictMode double-mount)
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    void (async () => {
      try {
        // Load persisted config and hydrate theme store before creating the terminal
        const cfg = await loadForgeConfig();
        if (cfg.theme) useThemeStore.getState().setTheme(cfg.theme);
        if (cfg.fontFamily) useThemeStore.getState().setFontFamily(cfg.fontFamily);
        if (cfg.fontSize) useThemeStore.getState().setFontSize(cfg.fontSize);

        // Initialize CAST detection and data
        void useCastStore.getState().initialize();

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

  // When the last tab is closed, open a new default session (respawn)
  useEffect(() => {
    if (!ready || tabs.length > 0) return;

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
  }, [tabs.length, ready]);

  // Creates an independent new tab (browser-style)
  const handleNewTab = useCallback(async () => {
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
    useLayoutStore.getState().addTab(sessionId);
  }, [addSession]);

  // Splits within the active tab
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

  const handleToggleShortcutRef = useCallback(() => {
    setShortcutRefOpen((prev) => !prev);
  }, []);

  const handleToggleCommandPalette = useCallback(() => {
    setCommandPaletteOpen((prev) => !prev);
  }, []);

  const handleCloseCommandPalette = useCallback(() => {
    setCommandPaletteOpen(false);
  }, []);

  const handleToggleSettings = useCallback(() => {
    setSettingsPanelOpen((prev) => !prev);
  }, []);

  // Register built-in commands — use overwriteCommand for StrictMode idempotency
  useEffect(() => {
    overwriteCommand({
      id: 'new-session',
      label: 'New Session',
      group: 'Layout',
      handler: () => { void handleNewTab(); },
    });
    overwriteCommand({
      id: 'new-tab',
      label: 'New Tab',
      group: 'Layout',
      keybind: '⌘T',
      handler: () => { void handleNewTab(); },
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
        const state = useLayoutStore.getState();
        const currentPaneId = state.activePaneId;
        if (!currentPaneId) return;
        // closePane already handles tab-closing when the tab has only one leaf
        state.closePane(currentPaneId);
      },
    });
    overwriteCommand({
      id: 'rename-session',
      label: 'Rename Session',
      group: 'Session',
      handler: () => {
        const currentActivePaneId = useLayoutStore.getState().activePaneId;
        const activeSessionId = useLayoutStore
          .getState()
          .getLeaves()
          .find((l) => l.id === currentActivePaneId)?.sessionId;
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
      handler: () => { setSettingsPanelOpen(true); },
    });
    overwriteCommand({
      id: 'open-settings',
      label: 'Open Settings',
      group: 'Settings',
      keybind: '⌘,',
      handler: () => { setSettingsPanelOpen(true); },
    });
    overwriteCommand({
      id: 'toggle-agent-output',
      label: 'Toggle Agent Output Panel',
      group: 'Layout',
      keybind: '⌘⇧O',
      handler: () => { useAgentOutputStore.getState().togglePanel(); },
    });
    overwriteCommand({
      id: 'cast.toggle-feed',
      label: 'Toggle CAST Agent Feed',
      group: 'CAST',
      keywords: ['cast', 'agents', 'feed', 'activity'],
      keybind: '⌘⇧A',
      handler: () => {
        const store = useCastStore.getState();
        if (store.available) store.setFeedOpen(!store.feedOpen);
      },
    });
    overwriteCommand({
      id: 'search-terminal',
      label: 'Search Terminal Output',
      group: 'Terminal',
      keybind: '⌘F',
      handler: () => { useTerminalSearchStore.getState().toggle(); },
    });
    overwriteCommand({
      id: 'show-shortcuts',
      label: 'Show Keyboard Shortcuts',
      group: 'Tools',
      keybind: '⌘/',
      keywords: ['keyboard', 'shortcuts', 'help', 'bindings', 'hotkeys'],
      handler: () => { setShortcutRefOpen((prev) => !prev); },
    });
    overwriteCommand({
      id: 'toggle-completion-notify',
      label: 'Toggle Completion Notification (this pane)',
      group: 'Terminal',
      handler: () => {
        const id = useLayoutStore.getState().activePaneId;
        if (id) useNotificationSettingsStore.getState().togglePane(id);
      },
    });
    overwriteCommand({
      id: 'cast.refresh',
      label: 'Refresh CAST Data',
      group: 'CAST',
      keywords: ['cast', 'refresh', 'reload'],
      handler: () => {
        const store = useCastStore.getState();
        if (store.available) {
          void store.refreshRuns();
          void store.refreshStats();
        }
      },
    });
  }, [handleNewTab, handleSplit]);

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

  const feedOpen = useCastStore((s) => s.feedOpen);
  const agentOutputOpen = useAgentOutputStore((s) => s.panelOpen);

  useKeyboardShortcuts(handleNewTab, handleSplit, handleToggleSidebar, handleToggleInfoPanel, handleToggleShortcutRef, handleToggleCommandPalette, handleToggleSettings);
  useProcessInspection();
  useClaudeDetection();
  useCastFeed();
  useCastData();
  useAgentOutput();

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--bg)',
        color: 'var(--fg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Title bar */}
      <div
        className="title-bar"
        style={{
          height: '28px',
          flexShrink: 0,
          backgroundColor: 'var(--title-bar-bg)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '12px',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--title-bar-text)',
          userSelect: 'none',
          position: 'relative',
        }}
      >
        <Flame />
        <span>Forge</span>
      </div>

      {/* Main content: sidebar + panes + info panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <SessionSidebar
          collapsed={sidebarCollapsed}
          onToggle={handleToggleSidebar}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TabBar
            onNewTab={() => { void handleNewTab(); }}
            onCloseTab={(tabId) => { useLayoutStore.getState().closeTab(tabId); }}
          />
          {ready && <PaneLayout />}
        </div>
        {feedOpen && <AgentFeed />}
        {agentOutputOpen && <AgentOutputPanel />}
        <InfoPanel open={infoPanelOpen} onClose={handleToggleInfoPanel} />
      </div>

      {/* Status bar — bottom of outer column */}
      <StatusBar
        onToggleInfoPanel={handleToggleInfoPanel}
        shortcutRefOpen={shortcutRefOpen}
        onToggleShortcutRef={handleToggleShortcutRef}
      />

      {/* Command palette overlay */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={handleCloseCommandPalette}
        onExecute={handleExecuteCommand}
      />

      {/* Settings panel overlay */}
      <SettingsPanel
        open={settingsPanelOpen}
        onClose={() => setSettingsPanelOpen(false)}
      />

      {/* Toast portal */}
      <ToastNotifications />
    </div>
  );
}

export default App;

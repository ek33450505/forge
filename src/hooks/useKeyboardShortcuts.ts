import { useEffect } from 'react';
import { useLayoutStore } from '../store/layout';
import { useTerminalSearchStore } from '../store/terminalSearch';

export function useKeyboardShortcuts(
  onNewTab?: () => void,
  onSplit?: (direction: 'horizontal' | 'vertical') => void,
  onToggleSidebar?: () => void,
  onToggleInfoPanel?: () => void,
  onToggleShortcutHints?: () => void,
  onToggleCommandPalette?: () => void,
  onToggleSettings?: () => void,
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const { closePane, setActivePane, getLeaves, activePaneId } =
        useLayoutStore.getState();

      // Cmd+F — terminal search
      if (e.metaKey && !e.shiftKey && e.key === 'f') {
        e.preventDefault();
        useTerminalSearchStore.getState().toggle();
      }

      // Cmd+K — command palette
      if (e.metaKey && !e.shiftKey && e.key === 'k') {
        e.preventDefault();
        onToggleCommandPalette?.();
      }

      // Cmd+T — new tab (independent session, not a split)
      if (e.metaKey && !e.shiftKey && e.key === 't') {
        e.preventDefault();
        onNewTab?.();
      }

      // Cmd+D — split horizontal within active tab
      if (e.metaKey && !e.shiftKey && e.key === 'd') {
        e.preventDefault();
        onSplit?.('horizontal');
      }

      // Cmd+Shift+D — split vertical within active tab
      if (e.metaKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        onSplit?.('vertical');
      }

      // Cmd+W — close active pane (or tab if last pane)
      if (e.metaKey && !e.shiftKey && e.key === 'w') {
        e.preventDefault();
        if (activePaneId) {
          // closePane handles tab-close when it is the last leaf
          closePane(activePaneId);
        }
      }

      // Cmd+B — toggle sidebar
      if (e.metaKey && !e.shiftKey && e.key === 'b') {
        e.preventDefault();
        onToggleSidebar?.();
      }

      // Cmd+I — toggle info panel
      if (e.metaKey && !e.shiftKey && e.key === 'i') {
        e.preventDefault();
        onToggleInfoPanel?.();
      }

      // Cmd+/ — toggle shortcut hints
      if (e.metaKey && !e.shiftKey && e.key === '/') {
        e.preventDefault();
        onToggleShortcutHints?.();
      }

      // Cmd+, — open settings
      if (e.metaKey && !e.shiftKey && e.key === ',') {
        e.preventDefault();
        onToggleSettings?.();
      }

      // Cmd+1 through Cmd+9 — switch to pane by index (within active tab)
      if (e.metaKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const leaves = getLeaves();
        const index = parseInt(e.key, 10) - 1;
        if (index < leaves.length) {
          setActivePane(leaves[index].id);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNewTab, onSplit, onToggleSidebar, onToggleInfoPanel, onToggleShortcutHints, onToggleCommandPalette, onToggleSettings]);
}

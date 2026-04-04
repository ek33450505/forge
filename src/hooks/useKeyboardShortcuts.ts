import { useEffect } from 'react';
import { useLayoutStore } from '../store/layout';
import { useCastStore } from '../store/cast';

export function useKeyboardShortcuts(
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

      // Cmd+K — command palette
      if (e.metaKey && !e.shiftKey && e.key === 'k') {
        e.preventDefault();
        onToggleCommandPalette?.();
      }

      // Cmd+D — split horizontal
      if (e.metaKey && !e.shiftKey && e.key === 'd') {
        e.preventDefault();
        onSplit?.('horizontal');
      }

      // Cmd+Shift+D — split vertical
      if (e.metaKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        onSplit?.('vertical');
      }

      // Cmd+W — close active pane
      if (e.metaKey && !e.shiftKey && e.key === 'w') {
        e.preventDefault();
        if (activePaneId) {
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

      // Cmd+Shift+A — toggle CAST agent feed
      if (e.metaKey && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        const castState = useCastStore.getState();
        if (castState.available) {
          castState.setFeedOpen(!castState.feedOpen);
        }
      }

      // Cmd+1 through Cmd+9 — switch to pane by index
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
  }, [onSplit, onToggleSidebar, onToggleInfoPanel, onToggleShortcutHints, onToggleCommandPalette, onToggleSettings]);
}

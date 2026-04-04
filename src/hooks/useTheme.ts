import { useEffect } from 'react';
import { useThemeStore, resolveTheme } from '../store/theme';
import type { ForgeTheme } from '../themes/types';

export function useTheme(): ForgeTheme {
  // Select primitive only — avoids object-in-selector re-render loop
  const themeName = useThemeStore((s) => s.themeName);
  // Resolve outside selector — safe, no subscription issue
  const theme = resolveTheme(themeName);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg', theme.background);
    root.style.setProperty('--fg', theme.foreground);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-soft', theme.accentSoft);
    root.style.setProperty('--sidebar-bg', theme.sidebar);
    root.style.setProperty('--sidebar-border', theme.sidebarBorder);
    root.style.setProperty('--title-bar-bg', theme.titleBar);
    root.style.setProperty('--title-bar-text', theme.titleBarText);
    root.style.setProperty('--pane-header-bg', theme.paneHeader);
    root.style.setProperty('--pane-header-active-bg', theme.paneHeaderActive);
    root.style.setProperty('--pane-header-text', theme.paneHeaderText);
    root.style.setProperty('--status-bar-bg', theme.statusBar);
    root.style.setProperty('--status-bar-text', theme.statusBarText);
    root.style.setProperty('--border', theme.border);
    root.style.setProperty('--input-bg', theme.inputBackground);
    root.style.setProperty('--input-text', theme.inputText);
    root.style.setProperty('--modal-bg', theme.modalBackground);
    root.style.setProperty('--modal-overlay', theme.modalOverlay);

    // Glow properties
    if (theme.glows) {
      root.style.setProperty('--glow-pane-active', theme.glows.activePaneHeader);
      root.style.setProperty('--glow-sidebar-item', theme.glows.sidebarItem);
      root.style.setProperty('--glow-title-radial', theme.glows.titleBarRadial);
    } else {
      root.style.setProperty('--glow-pane-active', 'none');
      root.style.setProperty('--glow-sidebar-item', 'none');
      root.style.setProperty('--glow-title-radial', 'none');
    }
    // Gradient properties
    if (theme.gradients) {
      root.style.setProperty('--sidebar-gradient', theme.gradients.sidebar);
      root.style.setProperty('--status-bar-gradient', theme.gradients.statusBar);
    } else {
      root.style.setProperty('--sidebar-gradient', theme.sidebar);
      root.style.setProperty('--status-bar-gradient', theme.statusBar);
    }
    // Scrollbar properties
    if (theme.scrollbar) {
      root.style.setProperty('--scrollbar-thumb', theme.scrollbar.thumb);
      root.style.setProperty('--scrollbar-track', theme.scrollbar.track);
    }
  }, [theme]);

  return theme;
}

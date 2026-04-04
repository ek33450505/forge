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
  }, [theme]);

  return theme;
}

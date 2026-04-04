import type { ForgeTheme } from './types';

export const forgeDark: ForgeTheme = {
  name: 'forge-dark',
  displayName: 'Forge Dark',
  background: '#1a1008',        // terminal area — deep warm black
  foreground: '#e8dcc8',
  accent: '#e8a838',            // amber
  accentSoft: '#b05828',        // visible ember (was too dark at #8b4010)
  sidebar: '#261410',           // noticeably warmer/redder than terminal bg
  sidebarBorder: '#5a3020',     // visible warm border (was invisible #3a2218)
  titleBar: '#0e0906',
  titleBarText: '#e8dcc8',
  paneHeader: '#1a1008',
  paneHeaderActive: '#2e1a0a',  // visible active bg contrast
  paneHeaderText: '#e8dcc8',
  statusBar: '#0e0906',
  statusBarText: '#b89878',     // warm tan, not blue
  border: '#5a3020',            // visible (was invisible #3a2218)
  inputBackground: '#261410',
  inputText: '#e8dcc8',
  modalBackground: '#261410',
  modalOverlay: 'rgba(0, 0, 0, 0.7)',
  terminal: {
    background: '#1a1008',
    foreground: '#e8dcc8',
    cursor: '#e8a838',
    cursorAccent: '#1a1008',
    selectionBackground: 'rgba(232, 168, 56, 0.25)',
    black: '#1a1008',
    red: '#c05020',
    green: '#70a840',
    yellow: '#e8a838',
    blue: '#4878c0',
    magenta: '#d04020',
    cyan: '#20a8a0',
    white: '#e8dcc8',
    brightBlack: '#5a3828',
    brightRed: '#e06030',
    brightGreen: '#90c858',
    brightYellow: '#f8c048',
    brightBlue: '#6898d8',
    brightMagenta: '#e85030',
    brightCyan: '#30c8b8',
    brightWhite: '#f8f0e0',
  },
};

import { describe, it, expect } from 'vitest';
import { THEME_REGISTRY } from './index';
import type { ForgeTheme } from './types';

const REQUIRED_KEYS: (keyof ForgeTheme)[] = [
  'name', 'displayName', 'background', 'foreground', 'accent',
  'sidebar', 'titleBar', 'statusBar', 'border', 'terminal',
  'claudeAccent', 'claudeAccentBg', 'separatorColor', 'separatorHover',
  'tabBar', 'tabActive', 'tabInactive', 'tabBorder', 'tabCloseHover',
  'success', 'warning', 'error', 'textMuted', 'textSubtle',
  'panelBackground', 'cardBackground', 'cardBorder',
];

const REQUIRED_TERMINAL_KEYS = [
  'background', 'foreground', 'cursor',
  'black', 'red', 'green', 'yellow', 'blue',
  'magenta', 'cyan', 'white',
  'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
  'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite',
];

describe('theme registry', () => {
  it('has exactly 6 themes', () => {
    expect(Object.keys(THEME_REGISTRY)).toHaveLength(6);
  });

  it('contains expected theme names', () => {
    expect(Object.keys(THEME_REGISTRY)).toEqual(
      expect.arrayContaining(['forge-dark', 'forge-light', 'dracula', 'one-dark', 'solarized-dark', 'high-contrast'])
    );
  });

  for (const [name, theme] of Object.entries(THEME_REGISTRY)) {
    describe(`theme: ${name}`, () => {
      it('defines all required top-level keys', () => {
        for (const key of REQUIRED_KEYS) {
          expect(theme).toHaveProperty(key);
        }
      });

      it('defines all 16 ANSI terminal colors', () => {
        for (const key of REQUIRED_TERMINAL_KEYS) {
          expect(theme.terminal).toHaveProperty(key);
          expect(typeof (theme.terminal as Record<string, unknown>)[key]).toBe('string');
        }
      });

      it('has non-empty display name', () => {
        expect(theme.displayName.length).toBeGreaterThan(0);
      });

      it('has name matching registry key', () => {
        expect(theme.name).toBe(name);
      });

      if (name === 'forge-dark') {
        it('forge-dark uses fire colors (no old blue background)', () => {
          expect(theme.background).not.toMatch(/^#1a1a/i);
          expect(theme.background).toBe('#1a1008');
        });

        it('forge-dark accent is in amber/orange range', () => {
          expect(theme.accent).toMatch(/^#[ec][0-9a-f]/i);
        });

        it('forge-dark has correct fire palette values', () => {
          expect(theme.accent).toBe('#e8a838');
          expect(theme.accentSoft).toBe('#b05828');
          expect(theme.foreground).toBe('#e8dcc8');
        });
      }
    });
  }
});

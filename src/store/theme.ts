import { create } from 'zustand';
import { THEME_REGISTRY, DEFAULT_THEME, type ThemeName } from '../themes/index';
import type { ForgeTheme } from '../themes/types';
import { saveForgeConfig } from '../hooks/useForgeConfig';

interface ThemeState {
  themeName: ThemeName;
  fontFamily: string;
  fontSize: number;
  setTheme: (name: ThemeName) => void;
  setFontFamily: (family: string) => void;
  setFontSize: (size: number) => void;
}

export const useThemeStore = create<ThemeState>()((set) => ({
  themeName: DEFAULT_THEME,
  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  fontSize: 14,
  setTheme: (name) => {
    set({ themeName: name });
    void saveForgeConfig({ theme: name });
  },
  setFontFamily: (family) => {
    set({ fontFamily: family });
    void saveForgeConfig({ fontFamily: family });
  },
  setFontSize: (size) => {
    set({ fontSize: size });
    void saveForgeConfig({ fontSize: size });
  },
}));

// Derived helper — call outside of React for store subscription
export function resolveTheme(name: ThemeName): ForgeTheme {
  return THEME_REGISTRY[name] ?? THEME_REGISTRY[DEFAULT_THEME];
}

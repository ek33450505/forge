import { invoke } from '@tauri-apps/api/core';
import type { ThemeName } from '../themes/index';

export interface ForgeConfig {
  theme?: ThemeName;
  fontFamily?: string;
  fontSize?: number;
}

export async function loadForgeConfig(): Promise<ForgeConfig> {
  try {
    const raw = await invoke<string>('config_read');
    return JSON.parse(raw) as ForgeConfig;
  } catch {
    return {};
  }
}

export async function saveForgeConfig(patch: Partial<ForgeConfig>): Promise<void> {
  try {
    const existing = await loadForgeConfig();
    const merged = { ...existing, ...patch };
    await invoke('config_write', { content: JSON.stringify(merged) });
  } catch (err) {
    console.error('Failed to save config:', err);
  }
}

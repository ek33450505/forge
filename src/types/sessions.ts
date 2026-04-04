export type SessionType = 'shell' | 'claude' | 'cast' | 'unknown';

export interface SessionTypeEntry {
  type: SessionType;
  manualOverride: boolean;
}

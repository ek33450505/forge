export type SessionType = 'shell' | 'claude' | 'unknown';

export interface SessionTypeEntry {
  type: SessionType;
  manualOverride: boolean;
}

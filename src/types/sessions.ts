export type SessionType =
  | 'shell'
  | 'claude-code'
  | 'aider'
  | 'ollama'
  | 'codex'
  | 'open-interpreter'
  | 'cursor-cli'
  | 'unknown';

export interface SessionTypeEntry {
  type: SessionType;
  manualOverride: boolean;
}

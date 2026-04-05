import { useSessionStore } from '../store/sessions';
import type { SessionType } from '../types/sessions';

export type FlameState = 'idle' | 'active' | 'complete' | 'error';

export function useFlameState(): FlameState {
  // Select primitive records — safe selectors (reference only changes on setSessionType)
  const sessionTypes = useSessionStore((s) => s.sessionTypes);

  // Derive in hook body, not in selector
  const entries = Object.values(sessionTypes);
  const AI_TYPES: SessionType[] = ['claude-code', 'aider', 'ollama', 'codex', 'open-interpreter', 'cursor-cli'];
  const hasAiSession = entries.some((e) => AI_TYPES.includes(e.type));

  if (hasAiSession) return 'active';
  return 'idle';
}

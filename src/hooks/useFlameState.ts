import { useSessionStore } from '../store/sessions';

export type FlameState = 'idle' | 'active' | 'complete' | 'error';

export function useFlameState(): FlameState {
  // Select primitive records — safe selectors (reference only changes on setSessionType)
  const sessionTypes = useSessionStore((s) => s.sessionTypes);
  const castFeedEnabled = useSessionStore((s) => s.castFeedEnabled);

  // Derive in hook body, not in selector
  const entries = Object.values(sessionTypes);
  const hasClaudeSession = entries.some((e) => e.type === 'claude');
  const hasCastSession = entries.some((e) => e.type === 'cast');

  if (hasCastSession && castFeedEnabled) return 'active';
  if (hasClaudeSession) return 'active';
  return 'idle';
}

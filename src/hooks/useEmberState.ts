import { useState, useEffect } from 'react';
import { useSessionStore } from '../store/sessions';
import { useCastStore } from '../store/cast';

export type EmberState = 'idle' | 'active' | 'thinking' | 'done' | 'error';

export function useEmberState(): EmberState {
  const sessionTypes = useSessionStore((s) => s.sessionTypes);
  const castAvailable = useCastStore((s) => s.available);
  const runs = useCastStore((s) => s.runs);

  const [doneTimer, setDoneTimer] = useState(false);

  const entries = Object.values(sessionTypes);
  const hasClaudeSession = entries.some((e) => e.type === 'claude');

  const runningCount = castAvailable ? runs.filter((r) => r.status === 'running').length : 0;
  const hasError = castAvailable ? runs.some((r) => r.status === 'failed') : false;
  const hasDone = castAvailable ? runs.some((r) => r.status === 'done') : false;

  // Transition to 'done' for 3 seconds after agent completion
  useEffect(() => {
    if (hasDone && runningCount === 0 && !hasError) {
      setDoneTimer(true);
      const timer = setTimeout(() => { setDoneTimer(false); }, 3000);
      return () => { clearTimeout(timer); };
    }
  }, [hasDone, runningCount, hasError]);

  if (hasError) return 'error';
  if (doneTimer) return 'done';
  if (runningCount > 2) return 'thinking';
  if (runningCount > 0 || hasClaudeSession) return 'active';
  return 'idle';
}

import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useSessionStore } from '../store/sessions';
import { ALL_DETECTORS, claudeCodeDetector } from '../lib/aiDetectors';
import type { PtyOutputPayload } from '../types/ipc';

// How many consecutive shell-pattern hits before reverting from an AI type → shell
const SHELL_REVERT_THRESHOLD = 3;

export function useAIDetection(): void {
  const setSessionType = useSessionStore((s) => s.setSessionType);
  const getSessionType = useSessionStore((s) => s.getSessionType);
  const sessions = useSessionStore((s) => s.sessions);

  useEffect(() => {
    const sessionIds = Object.keys(sessions);
    if (sessionIds.length === 0) return;

    // Per-session shell prompt hit counters for debounced revert
    const shellHits: Record<string, number> = {};

    const AI_TYPES = ALL_DETECTORS.map((d) => d.tool);

    const unlistenPromises: Promise<() => void>[] = sessionIds.map((sessionId) =>
      listen<PtyOutputPayload>(`pty-output-${sessionId}`, ({ payload }) => {
        const current = getSessionType(sessionId);
        if (current.manualOverride) return;

        const { data } = payload;

        // Run all detectors in order — first match wins
        for (const detector of ALL_DETECTORS) {
          if (detector.matchesOutput(data)) {
            shellHits[sessionId] = 0;
            setSessionType(sessionId, detector.tool, false);
            return;
          }
        }

        // Shell revert: only if currently an AI type
        if (AI_TYPES.includes(current.type)) {
          const matchesShell = claudeCodeDetector.matchesShell?.(data) ?? false;
          if (matchesShell) {
            shellHits[sessionId] = (shellHits[sessionId] ?? 0) + 1;
            if (shellHits[sessionId] >= SHELL_REVERT_THRESHOLD) {
              shellHits[sessionId] = 0;
              setSessionType(sessionId, 'shell', false);
            }
          }
        }
      })
    );

    return () => {
      void Promise.all(unlistenPromises).then((fns) => fns.forEach((fn) => fn()));
    };
  // Re-run when session list changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(sessions).join(',')]);
}

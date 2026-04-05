import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSessionStore } from '../store/sessions';
import type { SessionType } from '../types/sessions';

const POLL_INTERVAL_MS = 2000;

const PROCESS_TOOL_MAP: Record<string, SessionType> = {
  claude:          'claude-code',
  node:            'claude-code',  // Claude Code runs as Node subprocess
  aider:           'aider',
  ollama:          'ollama',
  codex:           'codex',
  interpreter:     'open-interpreter',
  'cursor-agent':  'cursor-cli',
};

/**
 * Pure helper — exported for testability.
 * Maps a foreground process name to a SessionType using partial, case-insensitive
 * matching against PROCESS_TOOL_MAP keys. Returns 'shell' when no key matches.
 */
export function detectToolFromProcessName(processName: string): SessionType {
  const lower = processName.toLowerCase();
  for (const [key, tool] of Object.entries(PROCESS_TOOL_MAP)) {
    if (lower.includes(key)) return tool;
  }
  return 'shell';
}

export function useProcessInspection() {
  const setSessionType = useSessionStore((s) => s.setSessionType);
  const getSessionType = useSessionStore((s) => s.getSessionType);
  const sessions = useSessionStore((s) => s.sessions);

  useEffect(() => {
    const sessionIds = Object.keys(sessions);
    if (sessionIds.length === 0) return;

    const interval = setInterval(() => {
      for (const sessionId of sessionIds) {
        // Don't poll if manually overridden
        const current = getSessionType(sessionId);
        if (current.manualOverride) continue;

        void invoke<string>('get_foreground_process', { sessionId })
          .then((processName) => {
            setSessionType(
              sessionId,
              detectToolFromProcessName(processName),
              false
            );
          })
          .catch(() => {
            // Session may have been killed — ignore
          });
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [sessions, setSessionType, getSessionType]);
}

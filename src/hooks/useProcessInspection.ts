import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSessionStore } from '../store/sessions';

const POLL_INTERVAL_MS = 2000;
const CLAUDE_PROCESS_NAMES = ['claude', 'node']; // 'node' catches claude code's node subprocess

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
            const isClaudeProcess = CLAUDE_PROCESS_NAMES.some(
              (name) => processName.toLowerCase().includes(name)
            );
            setSessionType(
              sessionId,
              isClaudeProcess ? 'claude-code' : 'shell',
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

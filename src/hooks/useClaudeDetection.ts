import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useSessionStore } from '../store/sessions';
import type { PtyOutputPayload } from '../types/ipc';

// Patterns known to appear in Claude Code output
const CLAUDE_PATTERNS: RegExp[] = [
  /Claude\s+\d+\.\d+/,           // version string on startup: "Claude 3.7"
  /<function_calls>/,             // tool use XML
  /\btool_use\b/,
  /\bthinking\b.*?\.\.\./,        // thinking indicator
  /\x1b\[[0-9;]*m.*?claude/i,    // "claude" in any ANSI-colored prompt
];

// Patterns that indicate return to shell (Claude Code exited)
const SHELL_PATTERNS: RegExp[] = [
  /\$\s*$/m,    // trailing shell prompt $
  /❯\s*$/m,     // zsh theme prompt
  />\s*$/m,     // generic prompt
];

// How many consecutive shell-pattern hits before reverting from claude → shell
const SHELL_REVERT_THRESHOLD = 3;

export function matchesClaudePattern(data: string): boolean {
  return CLAUDE_PATTERNS.some((p) => p.test(data));
}

export function matchesShellPattern(data: string): boolean {
  return SHELL_PATTERNS.some((p) => p.test(data));
}

export function useClaudeDetection() {
  const setSessionType = useSessionStore((s) => s.setSessionType);
  const getSessionType = useSessionStore((s) => s.getSessionType);
  const sessions = useSessionStore((s) => s.sessions);

  useEffect(() => {
    const sessionIds = Object.keys(sessions);
    if (sessionIds.length === 0) return;

    // Per-session shell prompt hit counters for debounced revert
    const shellHits: Record<string, number> = {};

    const unlistenPromises: Promise<() => void>[] = sessionIds.map((sessionId) =>
      listen<PtyOutputPayload>(`pty-output-${sessionId}`, ({ payload }) => {
        const current = getSessionType(sessionId);
        if (current.manualOverride) return;

        const { data } = payload;

        const matchesClaude = matchesClaudePattern(data);
        if (matchesClaude) {
          shellHits[sessionId] = 0;
          setSessionType(sessionId, 'claude', false);
          return;
        }

        // Only check shell revert if currently claude
        if (current.type === 'claude') {
          const matchesShell = matchesShellPattern(data);
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

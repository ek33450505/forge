import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { toast } from 'sonner';
import type { PtyOutputPayload } from '../types/ipc';
import { useNotificationSettingsStore } from '../store/notificationSettings';
import { stripAnsi } from '../lib/errorPatterns';

/** Shell prompt patterns — indicates a command has finished */
const PROMPT_RE = /[$%>❯]\s*$/;

/**
 * Detects when a long-running command completes in a pane and fires a notification.
 * A command is considered "running" when output appears without a trailing prompt.
 * When a prompt reappears after output, the command has completed.
 */
export function useCompletionNotifier(sessionId: string, paneId: string): void {
  const commandStartRef = useRef<number | null>(null);
  const hadOutputRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    let unlisten: (() => void) | null = null;

    (async () => {
      unlisten = await listen<PtyOutputPayload>(`pty-output-${sessionId}`, (event) => {
        if (!isMounted) return;

        const raw = event.payload.data;
        const clean = stripAnsi(raw);
        const lines = clean.split('\n');
        const lastLine = lines[lines.length - 1] || lines[lines.length - 2] || '';

        if (PROMPT_RE.test(lastLine)) {
          // Prompt appeared — command has finished
          if (hadOutputRef.current && commandStartRef.current) {
            const elapsed = (Date.now() - commandStartRef.current) / 1000;
            const state = useNotificationSettingsStore.getState();

            if (state.paneNotifyEnabled[paneId] && elapsed >= state.thresholdSeconds) {
              const msg = `Command completed in ${Math.round(elapsed)}s`;

              // Sonner toast
              toast.success(msg, { description: `Pane: ${paneId.slice(0, 8)}` });

              // Web Notification API (works in Tauri WebView)
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification('Forge', { body: msg });
              } else if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
                void Notification.requestPermission().then((perm) => {
                  if (perm === 'granted') {
                    new Notification('Forge', { body: msg });
                  }
                });
              }
            }
          }

          // Reset for next command
          commandStartRef.current = null;
          hadOutputRef.current = false;
        } else {
          // Non-prompt output — a command is running
          if (!commandStartRef.current) {
            commandStartRef.current = Date.now();
          }
          hadOutputRef.current = true;
        }
      });
    })();

    return () => {
      isMounted = false;
      if (unlisten) {
        unlisten();
      }
    };
  }, [sessionId, paneId]);
}

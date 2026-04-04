import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import type { PtyOutputPayload } from '../types/ipc';
import { matchError } from '../lib/errorPatterns';
import { useErrorAnnotationStore } from '../store/errorAnnotations';

/**
 * Listens to PTY output for a given session, buffers 500ms of output,
 * then runs error pattern matching. Rate-limits to 1 annotation per 2 seconds.
 */
export function useErrorDetection(sessionId: string): void {
  const bufferRef = useRef('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAnnotationRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    let unlisten: (() => void) | null = null;

    (async () => {
      unlisten = await listen<PtyOutputPayload>(`pty-output-${sessionId}`, (event) => {
        if (!isMounted) return;

        bufferRef.current += event.payload.data;

        // Debounce: wait 500ms of silence before matching
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
          if (!isMounted) return;

          const output = bufferRef.current;
          bufferRef.current = '';

          const match = matchError(output);
          if (!match) return;

          // Rate limit: 1 annotation per 2 seconds per pane
          const now = Date.now();
          if (now - lastAnnotationRef.current < 2000) return;
          lastAnnotationRef.current = now;

          useErrorAnnotationStore.getState().push(sessionId, {
            label: match.label,
            suggestion: match.suggestion,
          });
        }, 500);
      });
    })();

    return () => {
      isMounted = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (unlisten) {
        unlisten();
      }
    };
  }, [sessionId]);
}

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { PtyOutputPayload } from '../types/ipc';

interface UseTerminalResult {
  sessionId: string | null;
}

export function useTerminal(
  containerRef: React.RefObject<HTMLDivElement>
): UseTerminalResult {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const terminal = new Terminal({
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      theme: {
        background: '#1a1a2e',
        foreground: '#e0e0e0',
        cursor: '#e0e0e0',
      },
      cursorBlink: true,
      cursorStyle: 'block',
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.open(containerRef.current);

    let unlistenFn: (() => void) | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let isMounted = true;

    requestAnimationFrame(() => {
      if (!isMounted) return;
      fitAddon.fit();
      const { cols, rows } = terminal;

      (async () => {
        try {
          const id = await invoke<string>('pty_create', { shell: '/bin/zsh', cols, rows });

          if (!isMounted) {
            void invoke('pty_kill', { sessionId: id });
            return;
          }

          sessionIdRef.current = id;
          setSessionId(id);

          terminal.onData((data) => {
            const currentId = sessionIdRef.current;
            if (currentId) {
              void invoke('pty_write', { sessionId: currentId, data });
            }
          });

          const unlisten = await listen<PtyOutputPayload>('pty-output', (event) => {
            if (event.payload.session_id === sessionIdRef.current) {
              terminal.write(event.payload.data);
            }
          });

          if (!isMounted) {
            unlisten();
            return;
          }
          unlistenFn = unlisten;
        } catch (err: unknown) {
          console.error('useTerminal: initialization failed', err);
        }
      })();
    });

    const container = containerRef.current;

    resizeObserver = new ResizeObserver(() => {
      if (!isMounted) return;
      try {
        fitAddon.fit();
        const { cols, rows } = terminal;
        const id = sessionIdRef.current;
        if (id) {
          void invoke('pty_resize', { sessionId: id, cols, rows });
        }
      } catch {
        // Terminal may be disposed during cleanup
      }
    });
    resizeObserver.observe(container);

    return () => {
      isMounted = false;

      if (unlistenFn) {
        unlistenFn();
      }

      const id = sessionIdRef.current;
      if (id) {
        void invoke('pty_kill', { sessionId: id });
      }

      terminal.dispose();
      resizeObserver?.disconnect();
    };
  }, [containerRef]);

  return { sessionId };
}

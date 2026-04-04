import { useEffect } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { PtyOutputPayload } from '../types/ipc';

export function useTerminal(
  containerRef: React.RefObject<HTMLDivElement | null>,
  sessionId: string,
): void {
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
          // 1. Wire up input first
          terminal.onData((data) => {
            if (isMounted) {
              void invoke('pty_write', { sessionId, data });
            }
          });

          // 2. Start listening for output BEFORE resize
          const unlisten = await listen<PtyOutputPayload>(`pty-output-${sessionId}`, (event) => {
            terminal.write(event.payload.data);
          });

          if (!isMounted) {
            unlisten();
            return;
          }
          unlistenFn = unlisten;

          // 3. NOW resize — the shell redraws the prompt and we catch it
          await invoke('pty_resize', { sessionId, cols, rows });
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
        void invoke('pty_resize', { sessionId, cols, rows });
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

      // Do NOT kill the PTY here — session store owns that lifecycle
      terminal.dispose();
      resizeObserver?.disconnect();
    };
  }, [containerRef, sessionId]);
}

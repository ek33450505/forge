import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { PtyOutputPayload } from '../types/ipc';
import { useThemeStore, resolveTheme } from '../store/theme';

export function useTerminal(
  containerRef: React.RefObject<HTMLDivElement | null>,
  sessionId: string,
): void {
  // Lift terminal ref so we can update options without remounting
  const terminalRef = useRef<Terminal | null>(null);

  // Select primitives only — never select the whole theme object
  const themeName = useThemeStore((s) => s.themeName);
  const fontFamily = useThemeStore((s) => s.fontFamily);
  const fontSize = useThemeStore((s) => s.fontSize);

  // Mount effect — creates terminal once per sessionId
  useEffect(() => {
    if (!containerRef.current) return;

    const theme = resolveTheme(themeName);

    const terminal = new Terminal({
      fontFamily,
      fontSize,
      theme: theme.terminal,
      cursorBlink: true,
      cursorStyle: 'block',
    });

    terminalRef.current = terminal;

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
      terminalRef.current = null;

      if (unlistenFn) {
        unlistenFn();
      }

      // Do NOT kill the PTY here — session store owns that lifecycle
      terminal.dispose();
      resizeObserver?.disconnect();
    };
    // Only re-mount when containerRef or sessionId changes — NOT on theme/font changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, sessionId]);

  // Live theme/font update effect — updates options without remounting
  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) return;

    const theme = resolveTheme(themeName);
    terminal.options.fontFamily = fontFamily;
    terminal.options.fontSize = fontSize;
    terminal.options.theme = theme.terminal;
  }, [themeName, fontFamily, fontSize]);
}

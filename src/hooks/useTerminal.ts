import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { PtyOutputPayload } from '../types/ipc';
import { useThemeStore, resolveTheme } from '../store/theme';

/** Module-level map so TerminalSearch can access the SearchAddon per session */
export const searchAddonMap = new Map<string, SearchAddon>();

/** Module-level event bus for terminal input — ghost suggestion tracks line buffer */
export const terminalInputEmitter = new EventTarget();

/** Dispatch a custom event when user types in a terminal */
export function emitTerminalInput(sessionId: string, lineBuffer: string) {
  terminalInputEmitter.dispatchEvent(
    new CustomEvent('terminal-input', { detail: { sessionId, lineBuffer } }),
  );
}

/** Dispatch a custom event when a command is submitted (Enter pressed) */
export function emitTerminalSubmit(sessionId: string, command: string) {
  terminalInputEmitter.dispatchEvent(
    new CustomEvent('terminal-submit', { detail: { sessionId, command } }),
  );
}

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
    const searchAddon = new SearchAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.loadAddon(searchAddon);
    terminal.open(containerRef.current);

    searchAddonMap.set(sessionId, searchAddon);

    let unlistenFn: (() => void) | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let isMounted = true;

    requestAnimationFrame(() => {
      if (!isMounted) return;
      fitAddon.fit();
      const { cols, rows } = terminal;

      (async () => {
        try {
          // 1. Wire up input first — also track line buffer for ghost suggestions
          let lineBuffer = '';
          terminal.onData((data) => {
            if (!isMounted) return;

            // Track line buffer for ghost-text suggestions
            if (data === '\r' || data === '\n') {
              // Enter pressed — submit command and reset buffer
              if (lineBuffer.trim()) {
                emitTerminalSubmit(sessionId, lineBuffer);
              }
              lineBuffer = '';
              emitTerminalInput(sessionId, '');
            } else if (data === '\x7f' || data === '\b') {
              // Backspace
              lineBuffer = lineBuffer.slice(0, -1);
              emitTerminalInput(sessionId, lineBuffer);
            } else if (data === '\x03') {
              // Ctrl+C — reset buffer
              lineBuffer = '';
              emitTerminalInput(sessionId, '');
            } else if (data === '\t') {
              // Tab — handled by ghost suggestion accept, still forward to PTY
              // Ghost hook will intercept via its own listener
            } else if (data.length === 1 && data >= ' ') {
              // Printable character
              lineBuffer += data;
              emitTerminalInput(sessionId, lineBuffer);
            }

            void invoke('pty_write', { sessionId, data });
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
      // Skip fit when the container has zero dimensions — this happens when the
      // tab is hidden via visibility:hidden or display:none. Fitting to a zero-
      // size container would reset cols/rows to 0 and blank the terminal.
      if (!containerRef.current || containerRef.current.offsetWidth === 0 || containerRef.current.offsetHeight === 0) return;
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
      searchAddonMap.delete(sessionId);

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

import { useEffect, useState, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { terminalInputEmitter } from './useTerminal';
import { useCommandHistoryStore } from '../store/commandHistory';

interface GhostSuggestion {
  suggestion: string | null;
  lineBuffer: string;
  accept: () => void;
}

export function useGhostSuggestion(sessionId: string): GhostSuggestion {
  const [lineBuffer, setLineBuffer] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const sessionIdRef = useRef(sessionId);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Listen for line buffer changes
  useEffect(() => {
    const handler = (e: Event) => {
      const { sessionId: sid, lineBuffer: buf } = (e as CustomEvent).detail;
      if (sid !== sessionId) return;
      setLineBuffer(buf);

      if (!buf) {
        setSuggestion(null);
        return;
      }

      const match = useCommandHistoryStore.getState().getSuggestion(buf);
      setSuggestion(match);
    };

    terminalInputEmitter.addEventListener('terminal-input', handler);
    return () => terminalInputEmitter.removeEventListener('terminal-input', handler);
  }, [sessionId]);

  // Listen for command submissions to record in history
  useEffect(() => {
    const handler = (e: Event) => {
      const { sessionId: sid, command } = (e as CustomEvent).detail;
      if (sid !== sessionId) return;
      useCommandHistoryStore.getState().pushShellCommand(command);
    };

    terminalInputEmitter.addEventListener('terminal-submit', handler);
    return () => terminalInputEmitter.removeEventListener('terminal-submit', handler);
  }, [sessionId]);

  const accept = useCallback(() => {
    if (!suggestion || !lineBuffer) return;
    const remainder = suggestion.slice(lineBuffer.length);
    if (!remainder) return;
    void invoke('pty_write', { sessionId: sessionIdRef.current, data: remainder });
    setSuggestion(null);
  }, [suggestion, lineBuffer]);

  return { suggestion, lineBuffer, accept };
}

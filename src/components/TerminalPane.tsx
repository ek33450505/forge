import { useRef } from 'react';
import '@xterm/xterm/css/xterm.css';
import { useTerminal } from '../hooks/useTerminal';
import { useSessionStore } from '../store/sessions';
import { TerminalSearch } from './TerminalSearch';
import { ErrorAnnotation } from './ErrorAnnotation';
import { ErrorBoundary } from './ErrorBoundary';
import { useErrorDetection } from '../hooks/useErrorDetection';
import { useCompletionNotifier } from '../hooks/useCompletionNotifier';

interface TerminalPaneProps {
  paneId: string;
  sessionId: string;
  isActive: boolean;
  onFocus: () => void;
}

export function TerminalPane({ paneId, sessionId, isActive, onFocus }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useTerminal(containerRef, sessionId);
  useErrorDetection(sessionId);
  useCompletionNotifier(sessionId, paneId);

  const type = useSessionStore((s) => s.sessionTypes[sessionId]?.type ?? 'unknown');
  const AI_TYPES = ['claude-code', 'aider', 'ollama', 'codex', 'open-interpreter', 'cursor-cli'] as const;
  const isClaude = AI_TYPES.includes(type as typeof AI_TYPES[number]);

  return (
    <div
      onMouseDown={onFocus}
      className={isActive ? 'pane--active' : undefined}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: isClaude
          ? '2px solid var(--claude-accent)'
          : isActive
          ? '2px solid var(--accent)'
          : '2px solid transparent',
      }}
    >
      <ErrorBoundary paneId={paneId}>
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          <div
            ref={containerRef}
            style={{ width: '100%', height: '100%' }}
          />
          <TerminalSearch sessionId={sessionId} />
          <ErrorAnnotation sessionId={sessionId} />
        </div>
      </ErrorBoundary>
    </div>
  );
}

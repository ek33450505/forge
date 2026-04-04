import { useRef } from 'react';
import '@xterm/xterm/css/xterm.css';
import { useTerminal } from '../hooks/useTerminal';
import { PaneHeader } from './PaneHeader';
import { useSessionStore } from '../store/sessions';

interface TerminalPaneProps {
  sessionId: string;
  isActive: boolean;
  onFocus: () => void;
}

export function TerminalPane({ sessionId, isActive, onFocus }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useTerminal(containerRef, sessionId);

  const { type } = useSessionStore((s) => s.getSessionType(sessionId));
  const isClaude = type === 'claude';

  return (
    <div
      onMouseDown={onFocus}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: isClaude
          ? '2px solid #c084fc'
          : isActive
          ? '2px solid #e0e0e0'
          : '2px solid transparent',
      }}
    >
      <PaneHeader sessionId={sessionId} isActive={isActive} />
      <div
        ref={containerRef}
        style={{ flex: 1, overflow: 'hidden' }}
      />
    </div>
  );
}

import { useRef } from 'react';
import '@xterm/xterm/css/xterm.css';
import { useTerminal } from '../hooks/useTerminal';

interface TerminalPaneProps {
  sessionId: string;
  isActive: boolean;
  onFocus: () => void;
}

export function TerminalPane({ sessionId, isActive, onFocus }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useTerminal(containerRef, sessionId);

  return (
    <div
      ref={containerRef}
      onMouseDown={onFocus}
      style={{
        width: '100%',
        height: '100%',
        borderLeft: isActive ? '2px solid #e0e0e0' : '2px solid transparent',
      }}
    />
  );
}

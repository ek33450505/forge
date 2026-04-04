import { useEffect } from 'react';
import { useGhostSuggestion } from '../hooks/useGhostSuggestion';

interface GhostTextOverlayProps {
  sessionId: string;
}

export function GhostTextOverlay({ sessionId }: GhostTextOverlayProps) {
  const { suggestion, lineBuffer, accept } = useGhostSuggestion(sessionId);

  // Listen for keydown on window to intercept Tab
  useEffect(() => {
    if (!suggestion) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && suggestion) {
        e.preventDefault();
        e.stopPropagation();
        accept();
      }
    };

    // Use capture phase to intercept before xterm processes it
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [suggestion, accept]);

  if (!suggestion || !lineBuffer) return null;

  const remainder = suggestion.slice(lineBuffer.length);
  if (!remainder) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '8px',
        left: '12px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 10px',
        borderRadius: '4px',
        backgroundColor: 'var(--panel-bg)',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
        fontSize: '12px',
        opacity: 0.9,
        pointerEvents: 'none',
      }}
    >
      <span style={{ color: 'var(--fg-muted)', fontSize: '10px', fontWeight: 600 }}>
        Tab to complete:
      </span>
      <span style={{ color: 'var(--fg)', fontFamily: 'var(--font-mono, monospace)' }}>
        {lineBuffer}
        <span style={{ color: 'var(--fg-muted)', opacity: 0.5 }}>{remainder}</span>
      </span>
    </div>
  );
}

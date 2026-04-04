import { useEffect } from 'react';
import type { EmberState } from '../hooks/useEmberState';
import { useCastStore } from '../store/cast';

const IDLE_MESSAGES = [
  'All quiet on the forge...',
  'Ready when you are!',
  'Waiting for sparks...',
];

function getTooltipMessage(state: EmberState): string {
  const runs = useCastStore.getState().runs;
  const runningCount = runs.filter((r) => r.status === 'running').length;

  switch (state) {
    case 'idle':
      return IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)];
    case 'active':
      return runningCount > 0
        ? `${runningCount} agent${runningCount !== 1 ? 's' : ''} running!`
        : 'Claude is working!';
    case 'thinking':
      return `Orchestrating ${runningCount} agents...`;
    case 'done':
      return 'All agents finished!';
    case 'error':
      return 'Something went wrong...';
  }
}

interface EmberTooltipProps {
  state: EmberState;
  onDismiss: () => void;
}

export function EmberTooltip({ state, onDismiss }: EmberTooltipProps) {
  const message = getTooltipMessage(state);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => { clearTimeout(timer); };
  }, [onDismiss]);

  // Click outside to dismiss
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.ember-tooltip')) {
        onDismiss();
      }
    };
    // Delay listener to avoid catching the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [onDismiss]);

  return (
    <div
      className="ember-tooltip"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: '8px',
        padding: '6px 10px',
        fontSize: '11px',
        color: 'var(--fg)',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '6px',
        whiteSpace: 'nowrap',
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        pointerEvents: 'auto',
      }}
    >
      {message}
      {/* Triangle pointer */}
      <div
        style={{
          position: 'absolute',
          bottom: '-5px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: '8px',
          height: '8px',
          backgroundColor: 'var(--card-bg)',
          borderRight: '1px solid var(--card-border)',
          borderBottom: '1px solid var(--card-border)',
        }}
      />
    </div>
  );
}

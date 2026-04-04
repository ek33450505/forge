import { useSessionStore } from '../store/sessions';
import { SessionBadge } from './SessionBadge';

interface PaneHeaderProps {
  sessionId: string;
  isActive: boolean;
}

export function PaneHeader({ sessionId, isActive }: PaneHeaderProps) {
  const session = useSessionStore((s) => s.sessions[sessionId]);
  const type = useSessionStore((s) => s.sessionTypes[sessionId]?.type ?? 'unknown');

  const isClaude = type === 'claude';
  const name = session?.name ?? 'Shell';

  return (
    <div
      style={{
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        paddingLeft: '10px',
        paddingRight: '8px',
        backgroundColor: isActive ? 'var(--pane-header-active-bg)' : 'var(--pane-header-bg)',
        borderBottom: '1px solid var(--border)',
        borderLeft: isClaude
          ? '2px solid #c084fc'
          : isActive
          ? '2px solid var(--accent)'
          : '2px solid transparent',
        flexShrink: 0,
        userSelect: 'none',
        fontSize: '12px',
        color: 'var(--pane-header-text)',
      }}
    >
      <span
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </span>
      <SessionBadge type={type} size="sm" />
    </div>
  );
}

import { useSessionStore } from '../store/sessions';
import { useNotificationSettingsStore } from '../store/notificationSettings';
import { SessionBadge } from './SessionBadge';

interface PaneHeaderProps {
  sessionId: string;
  paneId: string;
  isActive: boolean;
}

export function PaneHeader({ sessionId, paneId, isActive }: PaneHeaderProps) {
  const session = useSessionStore((s) => s.sessions[sessionId]);
  const type = useSessionStore((s) => s.sessionTypes[sessionId]?.type ?? 'unknown');
  const notifyEnabled = useNotificationSettingsStore((s) => s.paneNotifyEnabled[paneId] ?? false);
  const toggleNotify = useNotificationSettingsStore((s) => s.togglePane);

  const AI_TYPES = ['claude-code', 'aider', 'ollama', 'codex', 'open-interpreter', 'cursor-cli'] as const;
  const isClaude = AI_TYPES.includes(type as typeof AI_TYPES[number]);
  const name = session?.name ?? 'Shell';

  return (
    <div
      className={isActive ? 'pane-header--active' : undefined}
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
          ? '2px solid var(--claude-accent)'
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
      <button
        onClick={() => toggleNotify(paneId)}
        title={notifyEnabled ? 'Disable completion notifications' : 'Enable completion notifications'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          padding: '0 2px',
          lineHeight: 1,
          color: 'var(--fg-muted)',
          opacity: notifyEnabled ? 1 : 0.4,
          transition: 'opacity 0.15s',
        }}
      >
        {notifyEnabled ? '\u{1F514}' : '\u{1F515}'}
      </button>
    </div>
  );
}

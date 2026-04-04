import type { SessionType } from '../types/sessions';

interface SessionBadgeProps {
  type: SessionType;
  size?: 'sm' | 'md';
}

const BADGE_CONFIG: Record<SessionType, { label: string; bg: string; color: string }> = {
  claude: { label: 'Claude', bg: 'var(--claude-accent-bg)',  color: 'var(--claude-accent)' },
  shell:  { label: 'Shell',  bg: 'var(--card-bg)',  color: 'var(--accent)' },
  unknown: { label: '',      bg: 'transparent', color: 'transparent' },
};

export function SessionBadge({ type, size = 'sm' }: SessionBadgeProps) {
  const config = BADGE_CONFIG[type];
  if (type === 'unknown') return null;

  const fontSize = size === 'sm' ? '10px' : '11px';
  const padding  = size === 'sm' ? '1px 5px' : '2px 7px';

  return (
    <span
      style={{
        fontSize,
        padding,
        borderRadius: '3px',
        backgroundColor: config.bg,
        color: config.color,
        fontWeight: 600,
        letterSpacing: '0.03em',
        flexShrink: 0,
        lineHeight: 1.4,
      }}
    >
      {config.label}
    </span>
  );
}

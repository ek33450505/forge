import { useCastStore } from '../store/cast';

export function CastStatsBar() {
  const available = useCastStore((s) => s.available);
  const stats = useCastStore((s) => s.stats);
  const setFeedOpen = useCastStore((s) => s.setFeedOpen);
  const feedOpen = useCastStore((s) => s.feedOpen);

  if (!available || !stats) return null;

  const lastTime = stats.last_event_at
    ? new Date(stats.last_event_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <>
      {stats.active_agents > 0 && (
        <span style={{ color: '#e8a838' }}>
          {stats.active_agents} agent{stats.active_agents !== 1 ? 's' : ''} running
        </span>
      )}
      <span
        title={`${stats.tokens_today.toLocaleString()} tokens today`}
        style={{ color: 'var(--status-bar-text)', cursor: 'default' }}
      >
        {stats.tokens_today >= 1000
          ? `${(stats.tokens_today / 1000).toFixed(1)}k tok`
          : `${stats.tokens_today} tok`}
      </span>
      {lastTime && (
        <span style={{ color: 'var(--status-bar-text)' }}>last: {lastTime}</span>
      )}
      <button
        onClick={() => setFeedOpen(!feedOpen)}
        title="Toggle CAST Agent Feed (Cmd+Shift+A)"
        style={{ background: 'none', border: 'none', color: feedOpen ? 'var(--accent)' : 'var(--status-bar-text)', cursor: 'pointer', fontSize: '11px', padding: '0 4px' }}
      >
        CAST
      </button>
    </>
  );
}

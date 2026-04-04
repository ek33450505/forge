import { useCastStore } from '../store/cast';
import { AgentRunDetail } from './AgentRunDetail';

const STATUS_DOT: Record<string, string> = {
  done: '#70a840', running: '#e8a838', failed: '#c05020', blocked: '#d04020',
};

export function AgentFeed() {
  const available = useCastStore((s) => s.available);
  const runs = useCastStore((s) => s.runs);
  const expandedRunId = useCastStore((s) => s.expandedRunId);
  const setExpandedRun = useCastStore((s) => s.setExpandedRun);
  const setFeedOpen = useCastStore((s) => s.setFeedOpen);

  if (!available) return null;

  return (
    <div style={{
      width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid var(--border)', background: 'var(--sidebar-bg)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ height: '32px', display: 'flex', alignItems: 'center', padding: '0 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <span style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'var(--status-bar-text)', flex: 1 }}>CAST AGENTS</span>
        <button onClick={() => setFeedOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--status-bar-text)', cursor: 'pointer', fontSize: '14px' }}>×</button>
      </div>

      {/* Run list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {runs.length === 0 && (
          <div style={{ padding: '16px 12px', fontSize: '11px', color: 'var(--status-bar-text)' }}>No recent runs</div>
        )}
        {runs.map((run) => (
          <div key={run.id}>
            <div
              onClick={() => setExpandedRun(expandedRunId === run.id ? null : run.id)}
              style={{
                padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                borderBottom: '1px solid rgba(90,48,32,0.3)',
                background: expandedRunId === run.id ? 'rgba(232,168,56,0.06)' : 'transparent',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_DOT[run.status] ?? '#b89878', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{run.agent}</span>
              {run.started_at && (
                <span style={{ fontSize: '10px', color: 'var(--status-bar-text)', flexShrink: 0 }}>
                  {new Date(run.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            {expandedRunId === run.id && (
              <AgentRunDetail run={run} onClose={() => setExpandedRun(null)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

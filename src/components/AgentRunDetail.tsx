import type { AgentRun } from '../types/cast';

const STATUS_COLOR: Record<string, string> = {
  done: 'var(--success)',
  running: 'var(--warning)',
  failed: 'var(--error)',
  blocked: 'var(--error)',
};

interface Props { run: AgentRun; onClose: () => void; }

export function AgentRunDetail({ run, onClose }: Props) {
  const color = STATUS_COLOR[run.status] ?? 'var(--text-muted)';
  const duration = run.started_at && run.ended_at
    ? Math.round((new Date(run.ended_at).getTime() - new Date(run.started_at).getTime()) / 1000)
    : null;
  return (
    <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--fg)', background: 'rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color, fontWeight: 'bold' }}>{run.status.toUpperCase()}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--status-bar-text)', cursor: 'pointer' }}>×</button>
      </div>
      {run.model && <div><span style={{ color: 'var(--status-bar-text)' }}>model:</span> {run.model}</div>}
      {duration !== null && <div><span style={{ color: 'var(--status-bar-text)' }}>duration:</span> {duration}s</div>}
      {run.tokens_in !== null && (
        <div><span style={{ color: 'var(--status-bar-text)' }}>tokens:</span> {(run.tokens_in ?? 0) + (run.tokens_out ?? 0)} ({run.tokens_in} in / {run.tokens_out} out)</div>
      )}
      {run.started_at && <div><span style={{ color: 'var(--status-bar-text)' }}>started:</span> {new Date(run.started_at).toLocaleTimeString()}</div>}
    </div>
  );
}

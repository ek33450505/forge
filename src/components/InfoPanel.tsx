import { useLayoutStore } from '../store/layout';
import { useSessionStore } from '../store/sessions';
import { useCwdWatch } from '../hooks/useCwdWatch';
import type { PaneNode } from '../store/layout';

interface InfoPanelProps {
  open: boolean;
  onClose: () => void;
}

function formatUptime(createdAt: number): string {
  const seconds = Math.floor(Date.now() / 1000 - createdAt);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function InfoPanel({ open, onClose }: InfoPanelProps) {
  // Resolve active session id from pane tree using direct property access
  const activeSessionId = useLayoutStore((s) => {
    const id = s.activePaneId;
    if (!id || !s.root) return null;
    function findLeaf(node: PaneNode): string | null {
      if (node.type === 'leaf') return node.id === id ? node.sessionId : null;
      return findLeaf(node.children[0]) ?? findLeaf(node.children[1]);
    }
    return findLeaf(s.root);
  });

  // Direct property access on sessions store
  const session = useSessionStore((s) =>
    activeSessionId ? s.sessions[activeSessionId] ?? null : null
  );
  const { cwd } = useCwdWatch();

  return (
    <div
      style={{
        width: open ? '280px' : '0px',
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width 200ms ease',
        backgroundColor: 'var(--modal-bg)',
        borderLeft: open ? '1px solid var(--border)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '12px',
        color: 'var(--fg)',
        fontFamily: 'monospace',
      }}
    >
      {open && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '13px' }}>Session Info</span>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--status-bar-text)', cursor: 'pointer', fontSize: '16px' }}
            >
              ×
            </button>
          </div>

          {session ? (
            <>
              <InfoRow label="Name" value={session.name} />
              <InfoRow label="Shell" value={session.shell} />
              <InfoRow label="ID" value={session.id.slice(0, 8) + '…'} />
              <InfoRow label="Uptime" value={formatUptime(session.created_at)} />
              <InfoRow label="CWD" value={cwd ? cwd.replace(/^\/Users\/[^/]+/, '~') : '—'} />
            </>
          ) : (
            <span style={{ color: '#666' }}>No active session</span>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

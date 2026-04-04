import { useState } from 'react';
import { useTokenMeter } from '../hooks/useTokenMeter';
import { useSessionStore } from '../store/sessions';

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M tok`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K tok`;
  return `${n} tok`;
}

function costColor(cost: number): string {
  if (cost < 1) return 'var(--success)';
  if (cost < 5) return 'var(--warning)';
  return 'var(--error)';
}

export function TokenMeter() {
  const { totalTokens, estimatedCost, perSession } = useTokenMeter();
  const sessions = useSessionStore((s) => s.sessions);
  const [popupOpen, setPopupOpen] = useState(false);

  if (totalTokens === 0) return null;

  return (
    <span
      style={{ position: 'relative', cursor: 'pointer' }}
      onClick={() => { setPopupOpen((prev) => !prev); }}
    >
      <span style={{ color: costColor(estimatedCost) }}>
        {formatTokens(totalTokens)} ${estimatedCost.toFixed(2)}
      </span>

      {popupOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '6px',
            padding: '8px 12px',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: 'var(--fg)',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 200,
            minWidth: '160px',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-muted)' }}>
            Per-session breakdown
          </div>
          {Object.entries(perSession).map(([sessionId, metrics]) => {
            const name = sessions[sessionId]?.name ?? sessionId.slice(0, 8);
            return (
              <div key={sessionId} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '1px 0' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                <span style={{ color: costColor(metrics.cost), flexShrink: 0 }}>
                  ${metrics.cost.toFixed(2)}
                </span>
              </div>
            );
          })}
          <div
            style={{
              marginTop: '4px',
              paddingTop: '4px',
              borderTop: '1px solid var(--card-border)',
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 600,
            }}
          >
            <span>Total</span>
            <span style={{ color: costColor(estimatedCost) }}>
              ${estimatedCost.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </span>
  );
}

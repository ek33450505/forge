import { useCwdWatch } from '../hooks/useCwdWatch';
import { useGitStatus } from '../hooks/useGitStatus';
import { useSessionStore } from '../store/sessions';

interface StatusBarProps {
  onToggleInfoPanel: () => void;
}

export function StatusBar({ onToggleInfoPanel }: StatusBarProps) {
  const { cwd } = useCwdWatch();
  const gitStatus = useGitStatus(cwd);
  // Direct property access — never method selectors
  const sessionCount = useSessionStore((s) => Object.keys(s.sessions).length);

  const displayCwd = cwd
    ? cwd.replace(/^\/Users\/[^/]+/, '~')
    : '—';

  return (
    <div
      style={{
        height: '24px',
        flexShrink: 0,
        backgroundColor: 'var(--status-bar-bg)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '12px',
        paddingRight: '12px',
        gap: '16px',
        fontSize: '11px',
        color: 'var(--status-bar-text)',
        userSelect: 'none',
        fontFamily: 'monospace',
      }}
    >
      {/* cwd */}
      <span title={cwd ?? undefined}>{displayCwd}</span>

      {/* git branch */}
      {gitStatus && (
        <span style={{ color: gitStatus.dirty ? '#e8a838' : '#6aaa64' }}>
          {gitStatus.dirty ? '● ' : ''}{gitStatus.branch}
        </span>
      )}

      <span style={{ flex: 1 }} />

      {/* session count */}
      <span>{sessionCount} session{sessionCount !== 1 ? 's' : ''}</span>

      {/* info panel toggle */}
      <button
        onClick={onToggleInfoPanel}
        title="Toggle Info Panel (⌘I)"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--status-bar-text)',
          cursor: 'pointer',
          fontSize: '11px',
          padding: '0 4px',
        }}
      >
        ⓘ
      </button>
    </div>
  );
}

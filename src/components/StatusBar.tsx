import { useRef } from 'react';
import { useCwdWatch } from '../hooks/useCwdWatch';
import { useGitStatus } from '../hooks/useGitStatus';
import { useSessionStore } from '../store/sessions';
import { ShortcutReference } from './ShortcutReference';

interface StatusBarProps {
  onToggleInfoPanel: () => void;
  shortcutRefOpen: boolean;
  onToggleShortcutRef: () => void;
}

export function StatusBar({ onToggleInfoPanel, shortcutRefOpen, onToggleShortcutRef }: StatusBarProps) {
  const { cwd } = useCwdWatch();
  const gitStatus = useGitStatus(cwd);
  // Direct property access — never method selectors
  const sessionCount = useSessionStore((s) => Object.keys(s.sessions).length);

  const kbdButtonRef = useRef<HTMLButtonElement>(null);

  const displayCwd = cwd
    ? cwd.replace(/^\/Users\/[^/]+/, '~')
    : '—';

  return (
    <>
      <div
        role="status"
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
          <span style={{ color: gitStatus.dirty ? 'var(--warning)' : 'var(--success)' }}>
            {gitStatus.dirty ? '● ' : ''}{gitStatus.branch}
          </span>
        )}

        <span style={{ flex: 1 }} />

        {/* session count */}
        <span>{sessionCount} session{sessionCount !== 1 ? 's' : ''}</span>

        {/* keyboard shortcut reference toggle */}
        <button
          ref={kbdButtonRef}
          onClick={onToggleShortcutRef}
          title="Keyboard Shortcuts (⌘/)"
          aria-label="Toggle keyboard shortcuts panel"
          aria-expanded={shortcutRefOpen}
          style={{
            background: 'none',
            border: 'none',
            color: shortcutRefOpen ? 'var(--accent)' : 'var(--status-bar-text)',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '0 4px',
            lineHeight: 1,
          }}
        >
          ⌨
        </button>

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

      {/* Shortcut reference popover — rendered outside the bar to avoid overflow clipping */}
      <ShortcutReference
        open={shortcutRefOpen}
        onClose={onToggleShortcutRef}
        anchorRef={kbdButtonRef}
      />
    </>
  );
}

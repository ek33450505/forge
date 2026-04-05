import { useRef } from 'react';
import { useCwdWatch } from '../hooks/useCwdWatch';
import { useGitStatus } from '../hooks/useGitStatus';
import { useSessionStore } from '../store/sessions';
import { useLayoutStore } from '../store/layout';
import { ShortcutReference } from './ShortcutReference';
import type { PaneNode } from '../store/layout';
import type { SessionType } from '../types/sessions';

function findSessionId(node: PaneNode | null, paneId: string | null): string | undefined {
  if (!node || !paneId) return undefined;
  if (node.type === 'leaf') return node.id === paneId ? node.sessionId : undefined;
  return findSessionId(node.children[0], paneId) ?? findSessionId(node.children[1], paneId);
}

const AI_TOOL_LABELS: Partial<Record<SessionType, string>> = {
  'claude-code':      'claude',
  'aider':            'aider',
  'ollama':           'ollama',
  'codex':            'codex',
  'open-interpreter': 'interpreter',
  'cursor-cli':       'cursor',
};

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

  // AI tool indicator: get active pane → session → type
  const activePaneId = useLayoutStore((s) => s.activePaneId);
  const root = useLayoutStore((s) => s.root);
  const sessionTypes = useSessionStore((s) => s.sessionTypes);

  const activeSessionId = findSessionId(root, activePaneId);
  const activeSessionType = activeSessionId ? sessionTypes[activeSessionId]?.type : undefined;
  const aiToolLabel = activeSessionType ? AI_TOOL_LABELS[activeSessionType] : undefined;

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

        {/* AI tool indicator */}
        {aiToolLabel && (
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
            [{aiToolLabel}]
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

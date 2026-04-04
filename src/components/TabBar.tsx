import { useLayoutStore } from '../store/layout';
import { useSessionStore } from '../store/sessions';
import { SessionBadge } from './SessionBadge';
import type { LeafNode, PaneNode } from '../store/layout';

function collectLeavesFromRoot(node: PaneNode): LeafNode[] {
  if (node.type === 'leaf') return [node];
  return [...collectLeavesFromRoot(node.children[0]), ...collectLeavesFromRoot(node.children[1])];
}

interface TabBarProps {
  onNewSession: () => void;
  onCloseSession: (paneId: string) => void;
}

export function TabBar({ onNewSession, onCloseSession }: TabBarProps) {
  const root = useLayoutStore((s) => s.root);
  const activePaneId = useLayoutStore((s) => s.activePaneId);
  const setActivePane = useLayoutStore((s) => s.setActivePane);
  const sessions = useSessionStore((s) => s.sessions);
  const sessionTypes = useSessionStore((s) => s.sessionTypes);

  const leaves = root ? collectLeavesFromRoot(root) : [];

  return (
    <div
      style={{
        height: '32px',
        flexShrink: 0,
        backgroundColor: 'var(--tab-bar)',
        borderBottom: '1px solid var(--tab-border)',
        display: 'flex',
        alignItems: 'stretch',
        overflowX: 'auto',
        userSelect: 'none',
        scrollbarWidth: 'none',
      }}
    >
      {leaves.map((leaf) => {
        const isActive = activePaneId === leaf.id;
        const session = sessions[leaf.sessionId];
        const name = session?.name ?? 'Shell';
        const sessionType = sessionTypes[leaf.sessionId]?.type ?? 'unknown';
        const isClaude = sessionType === 'claude';

        return (
          <div
            key={leaf.id}
            onMouseDown={(e) => {
              // Middle-click to close
              if (e.button === 1) {
                e.preventDefault();
                onCloseSession(leaf.id);
                return;
              }
              if (e.button === 0) {
                setActivePane(leaf.id);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 12px',
              fontSize: '12px',
              cursor: 'pointer',
              borderRight: '1px solid var(--tab-border)',
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              backgroundColor: isClaude
                ? 'var(--claude-accent-bg)'
                : isActive
                ? 'var(--tab-active)'
                : 'var(--tab-inactive)',
              color: isActive ? 'var(--fg)' : 'var(--text-muted)',
              whiteSpace: 'nowrap',
              minWidth: 0,
              position: 'relative',
            }}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '120px',
              }}
            >
              {name}
            </span>
            <SessionBadge type={sessionType} size="sm" />
            <button
              onMouseDown={(e) => {
                e.stopPropagation();
                onCloseSession(leaf.id);
              }}
              className="tab-close-btn"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-subtle)',
                cursor: 'pointer',
                fontSize: '14px',
                lineHeight: 1,
                padding: '0 2px',
                borderRadius: '2px',
                opacity: 0,
                transition: 'opacity 100ms',
              }}
              title="Close tab"
            >
              ×
            </button>
          </div>
        );
      })}

      {/* New tab button */}
      <button
        onClick={onNewSession}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: '16px',
          padding: '0 10px',
          lineHeight: 1,
          flexShrink: 0,
        }}
        title="New tab (⌘T)"
      >
        +
      </button>
    </div>
  );
}

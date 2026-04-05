import { useLayoutStore } from '../store/layout';
import { useSessionStore } from '../store/sessions';
import { SessionBadge } from './SessionBadge';

interface TabBarProps {
  onNewTab: () => void;
  onCloseTab: (tabId: string) => void;
}

export function TabBar({ onNewTab, onCloseTab }: TabBarProps) {
  const tabs = useLayoutStore((s) => s.tabs);
  const activeTabId = useLayoutStore((s) => s.activeTabId);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const sessions = useSessionStore((s) => s.sessions);
  const sessionTypes = useSessionStore((s) => s.sessionTypes);

  return (
    <div
      role="tablist"
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
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;

        // Use the first leaf's session for display
        function getFirstLeafSessionId(node: import('../store/layout').PaneNode): string | null {
          if (node.type === 'leaf') return node.sessionId;
          return getFirstLeafSessionId(node.children[0]);
        }

        const primarySessionId = getFirstLeafSessionId(tab.root);
        const session = primarySessionId ? sessions[primarySessionId] : undefined;
        const name = session?.name ?? 'Shell';
        const sessionType = primarySessionId
          ? (sessionTypes[primarySessionId]?.type ?? 'unknown')
          : 'unknown';
        const AI_TYPES = ['claude-code', 'aider', 'ollama', 'codex', 'open-interpreter', 'cursor-cli'] as const;
        const isClaude = AI_TYPES.includes(sessionType as typeof AI_TYPES[number]);

        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onMouseDown={(e) => {
              // Middle-click to close
              if (e.button === 1) {
                e.preventDefault();
                onCloseTab(tab.id);
                return;
              }
              if (e.button === 0) {
                setActiveTab(tab.id);
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
                onCloseTab(tab.id);
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
        onClick={onNewTab}
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
        aria-label="New tab"
        title="New tab (⌘T)"
      >
        +
      </button>
    </div>
  );
}

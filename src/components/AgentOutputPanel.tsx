import { useEffect, useRef } from 'react';
import { useAgentOutputStore } from '../store/agentOutput';
import { useLayoutStore } from '../store/layout';
import { useSessionStore } from '../store/sessions';
import { OutputCard } from './OutputCard';
import type { LeafNode, PaneNode } from '../store/layout';

function collectLeaves(node: PaneNode): LeafNode[] {
  if (node.type === 'leaf') return [node];
  return [...collectLeaves(node.children[0]), ...collectLeaves(node.children[1])];
}

export function AgentOutputPanel() {
  const panelOpen = useAgentOutputStore((s) => s.panelOpen);
  const blocks = useAgentOutputStore((s) => s.blocks);
  const setPanelOpen = useAgentOutputStore((s) => s.setPanelOpen);
  const clearSession = useAgentOutputStore((s) => s.clearSession);
  const root = useLayoutStore((s) => s.root);
  const activePaneId = useLayoutStore((s) => s.activePaneId);
  const sessionTypes = useSessionStore((s) => s.sessionTypes);

  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolled = useRef(false);

  // Find active session ID
  const leaves = root ? collectLeaves(root) : [];
  const activeLeaf = leaves.find((l) => l.id === activePaneId);
  const activeSessionId = activeLeaf?.sessionId;
  const activeType = activeSessionId ? sessionTypes[activeSessionId]?.type : undefined;

  // Get blocks for the active Claude session
  const sessionBlocks = activeSessionId ? blocks[activeSessionId] ?? [] : [];

  // Auto-scroll to bottom
  useEffect(() => {
    if (!userScrolled.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessionBlocks.length]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    // If user scrolled up, pause auto-scroll
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
    userScrolled.current = !atBottom;
  };

  if (!panelOpen) return null;

  return (
    <div
      style={{
        width: '300px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid var(--border)',
        background: 'var(--panel-bg)',
        overflow: 'hidden',
        transition: 'width 150ms ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: 'var(--status-bar-text)',
            flex: 1,
            textTransform: 'uppercase',
          }}
        >
          Agent Output
        </span>
        {activeSessionId && sessionBlocks.length > 0 && (
          <button
            onClick={() => { clearSession(activeSessionId); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-subtle)',
              cursor: 'pointer',
              fontSize: '10px',
              marginRight: '6px',
            }}
            title="Clear output"
          >
            Clear
          </button>
        )}
        <button
          onClick={() => { setPanelOpen(false); }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--status-bar-text)',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: 'auto', paddingTop: '4px', paddingBottom: '4px' }}
      >
        {activeType !== 'claude' && (
          <div style={{ padding: '16px 12px', fontSize: '11px', color: 'var(--text-muted)' }}>
            No Claude sessions active
          </div>
        )}
        {activeType === 'claude' && sessionBlocks.length === 0 && (
          <div style={{ padding: '16px 12px', fontSize: '11px', color: 'var(--text-muted)' }}>
            Waiting for output...
          </div>
        )}
        {sessionBlocks.map((block) => (
          <OutputCard key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
}

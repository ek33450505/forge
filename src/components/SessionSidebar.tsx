import { useState } from 'react';
import { useLayoutStore } from '../store/layout';
import { useSessionStore } from '../store/sessions';
import type { LeafNode } from '../store/layout';
import { SessionBadge } from './SessionBadge';
import { SessionTypeMenu } from './SessionTypeMenu';
import type { SessionType } from '../types/sessions';

function collectLeavesFromRoot(node: import('../store/layout').PaneNode): LeafNode[] {
  if (node.type === 'leaf') return [node];
  return [...collectLeavesFromRoot(node.children[0]), ...collectLeavesFromRoot(node.children[1])];
}

interface SidebarItemProps {
  index: number;
  leaf: LeafNode;
  name: string;
  isActive: boolean;
  sessionType: SessionType;
  onSelect: () => void;
  onRename: (name: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function SidebarItem({ index, leaf: _leaf, name, isActive, sessionType, onSelect, onRename, onContextMenu }: SidebarItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  function commitRename() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) {
      onRename(trimmed);
    }
    setEditing(false);
  }

  const isClaude = sessionType === 'claude';

  return (
    <div
      onMouseDown={onSelect}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setDraft(name);
        setEditing(true);
      }}
      onContextMenu={onContextMenu}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        cursor: 'pointer',
        borderLeft: isClaude
          ? '2px solid #c084fc'
          : isActive
          ? '2px solid #e0e0e0'
          : '2px solid transparent',
        backgroundColor: isClaude
          ? '#1a0f2e'
          : isActive
          ? '#1e2a4a'
          : 'transparent',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          fontSize: '11px',
          color: '#6070a0',
          minWidth: '14px',
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {index + 1}
      </span>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => { setDraft(e.target.value); }}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') setEditing(false);
          }}
          style={{
            flex: 1,
            background: '#0d1526',
            border: '1px solid #4060a0',
            borderRadius: '2px',
            color: '#e0e0e0',
            fontSize: '12px',
            padding: '1px 4px',
            outline: 'none',
          }}
        />
      ) : (
        <>
          <span
            style={{
              flex: 1,
              fontSize: '12px',
              color: isActive ? '#e0e0e0' : '#a0a8c0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </span>
          <SessionBadge type={sessionType} size="sm" />
        </>
      )}
    </div>
  );
}

interface SessionSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface ContextMenuState {
  sessionId: string;
  x: number;
  y: number;
}

export function SessionSidebar({ collapsed, onToggle }: SessionSidebarProps) {
  const root = useLayoutStore((s) => s.root);
  const activePaneId = useLayoutStore((s) => s.activePaneId);
  const setActivePane = useLayoutStore((s) => s.setActivePane);
  const sessions = useSessionStore((s) => s.sessions);
  const renameSession = useSessionStore((s) => s.renameSession);
  const sessionTypes = useSessionStore((s) => s.sessionTypes);
  const getSessionType = useSessionStore((s) => s.getSessionType);
  const setSessionType = useSessionStore((s) => s.setSessionType);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const leaves = root ? collectLeavesFromRoot(root) : [];

  return (
    <div
      style={{
        width: collapsed ? '20px' : '180px',
        minWidth: collapsed ? '20px' : '180px',
        backgroundColor: '#16213e',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRight: '1px solid #2a2a3e',
        transition: 'width 150ms ease, min-width 150ms ease',
        flexShrink: 0,
      }}
    >
      {collapsed ? (
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            color: '#6070a0',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '6px 0',
            width: '100%',
            textAlign: 'center',
          }}
          title="Expand sidebar (Cmd+B)"
        >
          ›
        </button>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderBottom: '1px solid #2a2a3e',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#6070a0',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Sessions
            </span>
            <button
              onClick={onToggle}
              style={{
                background: 'none',
                border: 'none',
                color: '#6070a0',
                cursor: 'pointer',
                fontSize: '14px',
                lineHeight: 1,
                padding: '0 2px',
              }}
              title="Collapse sidebar (Cmd+B)"
            >
              ‹
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {leaves.map((leaf, index) => {
              const session = sessions[leaf.sessionId];
              const name = session?.name ?? `Shell ${index + 1}`;
              const sessionType = sessionTypes[leaf.sessionId]?.type ?? 'unknown';
              return (
                <SidebarItem
                  key={leaf.id}
                  index={index}
                  leaf={leaf}
                  name={name}
                  isActive={activePaneId === leaf.id}
                  sessionType={sessionType}
                  onSelect={() => { setActivePane(leaf.id); }}
                  onRename={(newName) => { renameSession(leaf.sessionId, newName); }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ sessionId: leaf.sessionId, x: e.clientX, y: e.clientY });
                  }}
                />
              );
            })}
          </div>
        </>
      )}
      {contextMenu && (
        <SessionTypeMenu
          sessionId={contextMenu.sessionId}
          currentType={getSessionType(contextMenu.sessionId).type}
          x={contextMenu.x}
          y={contextMenu.y}
          onSelect={(id, type) => { setSessionType(id, type, true); }}
          onClose={() => { setContextMenu(null); }}
        />
      )}
    </div>
  );
}

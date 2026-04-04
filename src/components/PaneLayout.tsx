import { Group, Panel, Separator } from 'react-resizable-panels';
import type { PaneNode, LeafNode, BranchNode } from '../store/layout';
import { useLayoutStore } from '../store/layout';
import { TerminalPane } from './TerminalPane';

interface PaneLeafProps {
  node: LeafNode;
}

function PaneLeaf({ node }: PaneLeafProps) {
  const activePaneId = useLayoutStore((s) => s.activePaneId);
  const setActivePane = useLayoutStore((s) => s.setActivePane);

  return (
    <TerminalPane
      paneId={node.id}
      sessionId={node.sessionId}
      isActive={activePaneId === node.id}
      onFocus={() => { setActivePane(node.id); }}
    />
  );
}

interface PaneBranchProps {
  node: BranchNode;
}

function PaneBranch({ node }: PaneBranchProps) {
  const orientation = node.direction === 'horizontal' ? 'horizontal' : 'vertical';

  return (
    <Group orientation={orientation} style={{ width: '100%', height: '100%' }}>
      <Panel defaultSize={node.ratio * 100}>
        <PaneTree node={node.children[0]} />
      </Panel>
      <Separator
        style={{
          width: orientation === 'horizontal' ? '4px' : undefined,
          height: orientation === 'vertical' ? '4px' : undefined,
          backgroundColor: 'var(--separator)',
          cursor: orientation === 'horizontal' ? 'col-resize' : 'row-resize',
          flexShrink: 0,
        }}
      />
      <Panel defaultSize={(1 - node.ratio) * 100}>
        <PaneTree node={node.children[1]} />
      </Panel>
    </Group>
  );
}

interface PaneTreeProps {
  node: PaneNode;
}

function PaneTree({ node }: PaneTreeProps) {
  if (node.type === 'leaf') {
    return <PaneLeaf node={node} />;
  }
  return <PaneBranch node={node} />;
}

export function PaneLayout() {
  const tabs = useLayoutStore((s) => s.tabs);
  const activeTabId = useLayoutStore((s) => s.activeTabId);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          style={{
            position: 'absolute',
            inset: 0,
            // Use visibility instead of display:none so xterm can always measure
            // its container. display:none collapses dimensions to 0, which causes
            // fitAddon.fit() to resize the terminal to 0 cols/rows — blank terminal.
            visibility: tab.id === activeTabId ? 'visible' : 'hidden',
            pointerEvents: tab.id === activeTabId ? 'auto' : 'none',
          }}
        >
          <PaneTree node={tab.root} />
        </div>
      ))}
    </div>
  );
}

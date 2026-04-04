import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
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
  const direction = node.direction === 'horizontal' ? 'horizontal' : 'vertical';

  return (
    <PanelGroup direction={direction} style={{ width: '100%', height: '100%' }}>
      <Panel defaultSize={node.ratio * 100}>
        <PaneTree node={node.children[0]} />
      </Panel>
      <PanelResizeHandle
        style={{
          width: direction === 'horizontal' ? '4px' : undefined,
          height: direction === 'vertical' ? '4px' : undefined,
          backgroundColor: '#2a2a3e',
          cursor: direction === 'horizontal' ? 'col-resize' : 'row-resize',
          flexShrink: 0,
        }}
      />
      <Panel defaultSize={(1 - node.ratio) * 100}>
        <PaneTree node={node.children[1]} />
      </Panel>
    </PanelGroup>
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
  const root = useLayoutStore((s) => s.root);

  if (!root) return null;

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <PaneTree node={root} />
    </div>
  );
}

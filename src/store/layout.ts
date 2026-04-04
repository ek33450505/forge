import { create } from 'zustand';

export type SplitDirection = 'horizontal' | 'vertical';

export interface LeafNode {
  type: 'leaf';
  id: string;
  sessionId: string;
}

export interface BranchNode {
  type: 'branch';
  id: string;
  direction: SplitDirection;
  children: [PaneNode, PaneNode];
  ratio: number;
}

export type PaneNode = LeafNode | BranchNode;

// Recursively collect all LeafNodes from a tree
function collectLeaves(node: PaneNode): LeafNode[] {
  if (node.type === 'leaf') return [node];
  return [...collectLeaves(node.children[0]), ...collectLeaves(node.children[1])];
}

// Traverse the tree, call replacer on the node with the matching id.
// Returns a new tree with the replacement applied, or null if the node
// should be removed (replacer returns null).
function findAndReplace(
  node: PaneNode,
  targetId: string,
  replacer: (node: PaneNode) => PaneNode | null,
): PaneNode | null {
  if (node.id === targetId) {
    return replacer(node);
  }
  if (node.type === 'branch') {
    const left = findAndReplace(node.children[0], targetId, replacer);
    const right = findAndReplace(node.children[1], targetId, replacer);

    if (left === null && right === null) {
      // Both children removed — should not happen in normal use
      return null;
    }
    if (left === null) return right;
    if (right === null) return left;

    return {
      ...node,
      children: [left, right],
    } satisfies BranchNode;
  }
  return node;
}

interface LayoutState {
  root: PaneNode | null;
  activePaneId: string | null;

  initialize: (paneId: string, sessionId: string) => void;
  splitPane: (paneId: string, direction: SplitDirection, newSessionId: string) => LeafNode | null;
  closePane: (paneId: string) => void;
  setActivePane: (paneId: string) => void;
  focusNext: () => void;
  focusPrev: () => void;
  getLeaves: () => LeafNode[];
  setRoot: (root: PaneNode | null) => void;
}

export const useLayoutStore = create<LayoutState>()((set, get) => ({
  root: null,
  activePaneId: null,

  initialize(paneId, sessionId) {
    const leaf: LeafNode = { type: 'leaf', id: paneId, sessionId };
    set({ root: leaf, activePaneId: paneId });
  },

  splitPane(paneId, direction, newSessionId) {
    const { root } = get();
    if (!root) return null;

    let newLeaf: LeafNode | null = null;

    const newRoot = findAndReplace(root, paneId, (target) => {
      // splitPane is only ever called with leaf IDs — guard defensively
      if (target.type !== 'leaf') return target;
      const newPaneId = crypto.randomUUID();
      const fresh: LeafNode = { type: 'leaf', id: newPaneId, sessionId: newSessionId };
      newLeaf = fresh;
      const branch: BranchNode = {
        type: 'branch',
        id: crypto.randomUUID(),
        direction,
        children: [target, fresh],
        ratio: 0.5,
      };
      return branch;
    });

    if (newLeaf !== null) {
      set({ root: newRoot });
    }

    return newLeaf;
  },

  closePane(paneId) {
    const { root, activePaneId } = get();
    if (!root) return;

    // If root is a lone leaf, clear everything
    if (root.type === 'leaf' && root.id === paneId) {
      set({ root: null, activePaneId: null });
      return;
    }

    const newRoot = findAndReplace(root, paneId, () => null);

    // Determine new active pane if the closed pane was active
    let newActivePaneId = activePaneId;
    if (activePaneId === paneId) {
      const leaves = newRoot ? collectLeaves(newRoot) : [];
      newActivePaneId = leaves.length > 0 ? leaves[0].id : null;
    }

    set({ root: newRoot, activePaneId: newActivePaneId });
  },

  setActivePane(paneId) {
    set({ activePaneId: paneId });
  },

  focusNext() {
    const { root, activePaneId } = get();
    if (!root) return;
    const leaves = collectLeaves(root);
    if (leaves.length === 0) return;
    const currentIndex = leaves.findIndex((l) => l.id === activePaneId);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % leaves.length;
    set({ activePaneId: leaves[nextIndex].id });
  },

  focusPrev() {
    const { root, activePaneId } = get();
    if (!root) return;
    const leaves = collectLeaves(root);
    if (leaves.length === 0) return;
    const currentIndex = leaves.findIndex((l) => l.id === activePaneId);
    const prevIndex =
      currentIndex === -1
        ? leaves.length - 1
        : (currentIndex - 1 + leaves.length) % leaves.length;
    set({ activePaneId: leaves[prevIndex].id });
  },

  getLeaves() {
    const { root } = get();
    if (!root) return [];
    return collectLeaves(root);
  },

  setRoot(root) {
    set({ root });
  },
}));

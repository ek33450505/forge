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

export interface Tab {
  id: string;
  root: PaneNode;
  activePaneId: string;
}

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
  tabs: Tab[];
  activeTabId: string | null;

  // Backward-compat derived values (read from the active tab)
  activePaneId: string | null;
  // root is kept for backward compat with consumers that read s.root directly
  root: PaneNode | null;

  // Tab operations
  addTab: (sessionId: string) => string; // returns tab id
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;

  // Pane operations (within active tab)
  initialize: (paneId: string, sessionId: string) => void;
  splitPane: (paneId: string, direction: SplitDirection, newSessionId: string) => LeafNode | null;
  closePane: (paneId: string) => void;
  setActivePane: (paneId: string) => void;
  focusNext: () => void;
  focusPrev: () => void;

  // Helpers
  getLeaves: () => LeafNode[];
  getAllLeaves: () => LeafNode[];
  getActiveTab: () => Tab | undefined;

  // Legacy / compat
  setRoot: (root: PaneNode | null) => void;
}

// Helper: produce derived root and activePaneId from tab list + activeTabId
function deriveCompat(tabs: Tab[], activeTabId: string | null) {
  const activeTab = tabs.find((t) => t.id === activeTabId);
  return {
    root: activeTab?.root ?? null,
    activePaneId: activeTab?.activePaneId ?? null,
  };
}

export const useLayoutStore = create<LayoutState>()((set, get) => ({
  tabs: [],
  activeTabId: null,
  activePaneId: null,
  root: null,

  // ---------------------------------------------------------------------------
  // Tab operations
  // ---------------------------------------------------------------------------

  addTab(sessionId) {
    const tabId = crypto.randomUUID();
    const paneId = crypto.randomUUID();
    const leaf: LeafNode = { type: 'leaf', id: paneId, sessionId };
    const newTab: Tab = { id: tabId, root: leaf, activePaneId: paneId };
    const tabs = [...get().tabs, newTab];
    set({ tabs, activeTabId: tabId, ...deriveCompat(tabs, tabId) });
    return tabId;
  },

  closeTab(tabId) {
    const { tabs, activeTabId } = get();
    const idx = tabs.findIndex((t) => t.id === tabId);
    if (idx === -1) return;

    const newTabs = tabs.filter((t) => t.id !== tabId);

    let newActiveTabId: string | null = null;
    if (activeTabId === tabId) {
      // Switch to adjacent tab: prefer next, fall back to previous
      if (newTabs.length > 0) {
        const nextIdx = Math.min(idx, newTabs.length - 1);
        newActiveTabId = newTabs[nextIdx].id;
      }
      // else: no tabs left — state becomes empty (respawn effect in App.tsx handles it)
    } else {
      newActiveTabId = activeTabId;
    }

    set({ tabs: newTabs, activeTabId: newActiveTabId, ...deriveCompat(newTabs, newActiveTabId) });
  },

  setActiveTab(tabId) {
    const { tabs } = get();
    set({ activeTabId: tabId, ...deriveCompat(tabs, tabId) });
  },

  // ---------------------------------------------------------------------------
  // Pane operations (operate on the ACTIVE tab's tree)
  // ---------------------------------------------------------------------------

  initialize(paneId, sessionId) {
    const leaf: LeafNode = { type: 'leaf', id: paneId, sessionId };
    const tabId = crypto.randomUUID();
    const newTab: Tab = { id: tabId, root: leaf, activePaneId: paneId };
    const tabs = [newTab];
    set({ tabs, activeTabId: tabId, ...deriveCompat(tabs, tabId) });
  },

  splitPane(paneId, direction, newSessionId) {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return null;

    const tabIdx = tabs.findIndex((t) => t.id === activeTabId);
    if (tabIdx === -1) return null;

    const tab = tabs[tabIdx];
    let newLeaf: LeafNode | null = null;

    const newRoot = findAndReplace(tab.root, paneId, (target) => {
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

    if (newLeaf !== null && newRoot !== null) {
      const updatedTab: Tab = { ...tab, root: newRoot };
      const newTabs = tabs.map((t, i) => (i === tabIdx ? updatedTab : t));
      set({ tabs: newTabs, ...deriveCompat(newTabs, activeTabId) });
    }

    return newLeaf;
  },

  closePane(paneId) {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return;

    const tabIdx = tabs.findIndex((t) => t.id === activeTabId);
    if (tabIdx === -1) return;

    const tab = tabs[tabIdx];

    // If the tab has only one leaf, close the entire tab
    if (tab.root.type === 'leaf' && tab.root.id === paneId) {
      get().closeTab(activeTabId);
      return;
    }

    const newRoot = findAndReplace(tab.root, paneId, () => null);

    let newActivePaneId = tab.activePaneId;
    if (tab.activePaneId === paneId) {
      const leaves = newRoot ? collectLeaves(newRoot) : [];
      newActivePaneId = leaves.length > 0 ? leaves[0].id : '';
    }

    const updatedTab: Tab = { ...tab, root: newRoot ?? tab.root, activePaneId: newActivePaneId };
    const newTabs = tabs.map((t, i) => (i === tabIdx ? updatedTab : t));
    set({ tabs: newTabs, ...deriveCompat(newTabs, activeTabId) });
  },

  setActivePane(paneId) {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return;

    const tabIdx = tabs.findIndex((t) => t.id === activeTabId);
    if (tabIdx === -1) return;

    const updatedTab: Tab = { ...tabs[tabIdx], activePaneId: paneId };
    const newTabs = tabs.map((t, i) => (i === tabIdx ? updatedTab : t));
    set({ tabs: newTabs, activePaneId: paneId });
  },

  focusNext() {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return;
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return;
    const leaves = collectLeaves(tab.root);
    if (leaves.length === 0) return;
    const currentIndex = leaves.findIndex((l) => l.id === tab.activePaneId);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % leaves.length;
    get().setActivePane(leaves[nextIndex].id);
  },

  focusPrev() {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return;
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return;
    const leaves = collectLeaves(tab.root);
    if (leaves.length === 0) return;
    const currentIndex = leaves.findIndex((l) => l.id === tab.activePaneId);
    const prevIndex =
      currentIndex === -1
        ? leaves.length - 1
        : (currentIndex - 1 + leaves.length) % leaves.length;
    get().setActivePane(leaves[prevIndex].id);
  },

  // Returns leaves of the ACTIVE tab only — for PaneLayout
  getLeaves() {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return [];
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return [];
    return collectLeaves(tab.root);
  },

  // Returns leaves from ALL tabs — for SessionSidebar
  getAllLeaves() {
    const { tabs } = get();
    return tabs.flatMap((t) => collectLeaves(t.root));
  },

  getActiveTab() {
    const { tabs, activeTabId } = get();
    return tabs.find((t) => t.id === activeTabId);
  },

  // Legacy compat — update the active tab's root directly
  setRoot(root) {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return;
    const tabIdx = tabs.findIndex((t) => t.id === activeTabId);
    if (tabIdx === -1) return;
    const tab = tabs[tabIdx];
    const updatedTab: Tab = { ...tab, root: root ?? tab.root };
    const newTabs = tabs.map((t, i) => (i === tabIdx ? updatedTab : t));
    set({ tabs: newTabs, ...deriveCompat(newTabs, activeTabId) });
  },
}));

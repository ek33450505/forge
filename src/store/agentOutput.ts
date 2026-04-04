import { create } from 'zustand';
import type { OutputBlock } from '../types/agentOutput';

const MAX_BLOCKS_PER_SESSION = 500;

interface AgentOutputStore {
  blocks: Record<string, OutputBlock[]>;
  panelOpen: boolean;
  addBlocks: (sessionId: string, newBlocks: OutputBlock[]) => void;
  clearSession: (sessionId: string) => void;
  toggleBlock: (blockId: string) => void;
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
}

export const useAgentOutputStore = create<AgentOutputStore>()((set) => ({
  blocks: {},
  panelOpen: false,

  addBlocks(sessionId, newBlocks) {
    if (newBlocks.length === 0) return;
    set((state) => {
      const existing = state.blocks[sessionId] ?? [];
      let combined = [...existing, ...newBlocks];
      // Trim oldest to stay under limit
      if (combined.length > MAX_BLOCKS_PER_SESSION) {
        combined = combined.slice(combined.length - MAX_BLOCKS_PER_SESSION);
      }
      return { blocks: { ...state.blocks, [sessionId]: combined } };
    });
  },

  clearSession(sessionId) {
    set((state) => {
      const next = { ...state.blocks };
      delete next[sessionId];
      return { blocks: next };
    });
  },

  toggleBlock(blockId) {
    set((state) => {
      const newBlocks = { ...state.blocks };
      for (const sessionId of Object.keys(newBlocks)) {
        newBlocks[sessionId] = newBlocks[sessionId].map((b) =>
          b.id === blockId ? { ...b, collapsed: !b.collapsed } : b,
        );
      }
      return { blocks: newBlocks };
    });
  },

  togglePanel() {
    set((state) => ({ panelOpen: !state.panelOpen }));
  },

  setPanelOpen(open) {
    set({ panelOpen: open });
  },
}));

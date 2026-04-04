import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { AgentRun, CastStats } from '../types/cast';

interface CastState {
  available: boolean;
  feedOpen: boolean;
  runs: AgentRun[];
  stats: CastStats | null;
  expandedRunId: number | null;

  initialize: () => Promise<void>;
  setFeedOpen: (open: boolean) => void;
  setExpandedRun: (id: number | null) => void;
  refreshRuns: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export const useCastStore = create<CastState>()((set, get) => ({
  available: false,
  feedOpen: false,
  runs: [],
  stats: null,
  expandedRunId: null,

  async initialize() {
    const available = await invoke<boolean>('cast_detect').catch(() => false);
    set({ available });
    if (available) {
      await get().refreshRuns();
      await get().refreshStats();
    }
  },

  setFeedOpen(open) {
    set({ feedOpen: open });
  },

  setExpandedRun(id) {
    set({ expandedRunId: id });
  },

  async refreshRuns() {
    const runs = await invoke<AgentRun[]>('cast_query_recent_runs', { limit: 50 }).catch(() => []);
    set({ runs });
  },

  async refreshStats() {
    const stats = await invoke<CastStats>('cast_query_stats').catch(() => null);
    set({ stats });
  },
}));

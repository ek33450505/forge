import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CommandHistoryState {
  recentIds: string[];
  pushCommand: (id: string) => void;
  clearHistory: () => void;
}

export const useCommandHistoryStore = create<CommandHistoryState>()(
  persist(
    (set) => ({
      recentIds: [],
      pushCommand(id) {
        set((state) => {
          const filtered = state.recentIds.filter((x) => x !== id);
          return { recentIds: [id, ...filtered].slice(0, 5) };
        });
      },
      clearHistory() {
        set({ recentIds: [] });
      },
    }),
    { name: 'forge-command-history' },
  ),
);

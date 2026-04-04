import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CommandHistoryState {
  recentIds: string[];
  /** Shell command history for ghost-text suggestions */
  shellHistory: string[];
  pushCommand: (id: string) => void;
  pushShellCommand: (cmd: string) => void;
  getSuggestion: (prefix: string) => string | null;
  clearHistory: () => void;
}

const MAX_SHELL_HISTORY = 200;

export const useCommandHistoryStore = create<CommandHistoryState>()(
  persist(
    (set, get) => ({
      recentIds: [],
      shellHistory: [],
      pushCommand(id) {
        set((state) => {
          const filtered = state.recentIds.filter((x) => x !== id);
          return { recentIds: [id, ...filtered].slice(0, 5) };
        });
      },
      pushShellCommand(cmd) {
        const trimmed = cmd.trim();
        if (!trimmed) return;
        set((state) => {
          const filtered = state.shellHistory.filter((x) => x !== trimmed);
          return { shellHistory: [trimmed, ...filtered].slice(0, MAX_SHELL_HISTORY) };
        });
      },
      getSuggestion(prefix) {
        if (!prefix) return null;
        const { shellHistory } = get();
        return shellHistory.find((cmd) => cmd.startsWith(prefix) && cmd !== prefix) ?? null;
      },
      clearHistory() {
        set({ recentIds: [], shellHistory: [] });
      },
    }),
    { name: 'forge-command-history' },
  ),
);

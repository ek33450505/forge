import { create } from 'zustand';

interface TerminalSearchState {
  open: boolean;
  query: string;
  caseSensitive: boolean;
  useRegex: boolean;
  matchIndex: number;
  matchCount: number;
  setOpen: (open: boolean) => void;
  setQuery: (q: string) => void;
  toggle: () => void;
  toggleCaseSensitive: () => void;
  toggleRegex: () => void;
  setMatchInfo: (index: number, count: number) => void;
}

export const useTerminalSearchStore = create<TerminalSearchState>()((set) => ({
  open: false,
  query: '',
  caseSensitive: false,
  useRegex: false,
  matchIndex: 0,
  matchCount: 0,
  setOpen(open) {
    set({ open, ...(open ? {} : { query: '', matchIndex: 0, matchCount: 0 }) });
  },
  setQuery(query) {
    set({ query });
  },
  toggle() {
    set((s) => ({
      open: !s.open,
      ...(!s.open ? {} : { query: '', matchIndex: 0, matchCount: 0 }),
    }));
  },
  toggleCaseSensitive() {
    set((s) => ({ caseSensitive: !s.caseSensitive }));
  },
  toggleRegex() {
    set((s) => ({ useRegex: !s.useRegex }));
  },
  setMatchInfo(matchIndex, matchCount) {
    set({ matchIndex, matchCount });
  },
}));

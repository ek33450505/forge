import { create } from 'zustand';

interface SessionState {
  sessions: string[];
}

export const useSessionStore = create<SessionState>()(() => ({
  sessions: [],
}));

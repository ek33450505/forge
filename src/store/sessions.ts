import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { SessionInfo } from '../types/ipc';

interface SessionState {
  sessions: Record<string, SessionInfo>;

  addSession: (info: SessionInfo) => void;
  removeSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  getSession: (id: string) => SessionInfo | undefined;
  loadSessions: () => Promise<void>;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  sessions: {},

  addSession(info) {
    set((state) => ({
      sessions: { ...state.sessions, [info.id]: info },
    }));
  },

  removeSession(id) {
    set((state) => {
      const next = { ...state.sessions };
      delete next[id];
      return { sessions: next };
    });
    void invoke('pty_kill', { sessionId: id });
  },

  renameSession(id, name) {
    set((state) => {
      const existing = state.sessions[id];
      if (!existing) return state;
      return {
        sessions: {
          ...state.sessions,
          [id]: { ...existing, name },
        },
      };
    });
    void invoke('session_rename', { sessionId: id, name });
  },

  getSession(id) {
    return get().sessions[id];
  },

  async loadSessions() {
    const list = await invoke<SessionInfo[]>('session_list');
    const map: Record<string, SessionInfo> = {};
    for (const info of list) {
      map[info.id] = info;
    }
    set({ sessions: map });
  },
}));

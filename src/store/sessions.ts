import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { SessionInfo } from '../types/ipc';
import type { SessionType, SessionTypeEntry } from '../types/sessions';

interface SessionState {
  sessions: Record<string, SessionInfo>;
  sessionTypes: Record<string, SessionTypeEntry>;

  addSession: (info: SessionInfo) => void;
  removeSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  getSession: (id: string) => SessionInfo | undefined;
  loadSessions: () => Promise<void>;

  setSessionType: (id: string, type: SessionType, manual: boolean) => void;
  getSessionType: (id: string) => SessionTypeEntry;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  sessions: {},
  sessionTypes: {},

  addSession(info) {
    set((state) => ({
      sessions: { ...state.sessions, [info.id]: info },
    }));
  },

  removeSession(id) {
    set((state) => {
      const nextSessions = { ...state.sessions };
      delete nextSessions[id];
      const nextSessionTypes = { ...state.sessionTypes };
      delete nextSessionTypes[id];
      return { sessions: nextSessions, sessionTypes: nextSessionTypes };
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

  setSessionType(id, type, manual) {
    const existing = get().sessionTypes[id];
    // If not manual and existing entry has manualOverride true, skip (manual is sticky)
    if (!manual && existing?.manualOverride === true) return;
    set((state) => ({
      sessionTypes: {
        ...state.sessionTypes,
        [id]: { type, manualOverride: manual },
      },
    }));
  },

  getSessionType(id) {
    return get().sessionTypes[id] ?? { type: 'unknown', manualOverride: false };
  },

}));

import { create } from 'zustand';

export interface Annotation {
  id: string;
  label: string;
  suggestion: string;
  timestamp: number;
  dismissed: boolean;
}

interface ErrorAnnotationState {
  annotations: Record<string, Annotation[]>;
  push: (sessionId: string, ann: Omit<Annotation, 'id' | 'timestamp' | 'dismissed'>) => void;
  dismiss: (sessionId: string, id: string) => void;
  clearAll: (sessionId: string) => void;
}

const MAX_ANNOTATIONS_PER_SESSION = 3;

export const useErrorAnnotationStore = create<ErrorAnnotationState>()((set) => ({
  annotations: {},
  push(sessionId, ann) {
    set((state) => {
      const existing = state.annotations[sessionId] ?? [];
      const newAnnotation: Annotation = {
        ...ann,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        dismissed: false,
      };
      // Add to front, cap at MAX, evict oldest (end of array)
      const updated = [newAnnotation, ...existing].slice(0, MAX_ANNOTATIONS_PER_SESSION);
      return { annotations: { ...state.annotations, [sessionId]: updated } };
    });
  },
  dismiss(sessionId, id) {
    set((state) => {
      const existing = state.annotations[sessionId];
      if (!existing) return state;
      return {
        annotations: {
          ...state.annotations,
          [sessionId]: existing.map((a) => (a.id === id ? { ...a, dismissed: true } : a)),
        },
      };
    });
  },
  clearAll(sessionId) {
    set((state) => ({
      annotations: { ...state.annotations, [sessionId]: [] },
    }));
  },
}));

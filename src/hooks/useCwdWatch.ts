import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useLayoutStore } from '../store/layout';
import type { PaneNode } from '../store/layout';

const POLL_INTERVAL_MS = 3000;

export function useCwdWatch(): { cwd: string | null } {
  // Resolve active session id from pane tree using direct property access
  const activeSessionId = useLayoutStore((s) => {
    const id = s.activePaneId;
    if (!id || !s.root) return null;

    function findLeaf(node: PaneNode): string | null {
      if (node.type === 'leaf') return node.id === id ? node.sessionId : null;
      // BranchNode uses children[0] and children[1]
      return findLeaf(node.children[0]) ?? findLeaf(node.children[1]);
    }
    return findLeaf(s.root);
  });

  const [cwd, setCwd] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCwd = async (sessionId: string) => {
    try {
      const result = await invoke<string>('get_cwd', { sessionId });
      setCwd(result);
    } catch {
      // Session may not have a resolvable cwd yet — ignore
    }
  };

  useEffect(() => {
    // Clear previous interval
    if (timerRef.current) clearInterval(timerRef.current);
    if (!activeSessionId) {
      setCwd(null);
      return;
    }

    // Fetch immediately on session change, then poll
    void fetchCwd(activeSessionId);
    timerRef.current = setInterval(() => {
      void fetchCwd(activeSessionId);
    }, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSessionId]);

  return { cwd };
}

import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useSessionStore } from '../store/sessions';
import { useAgentOutputStore } from '../store/agentOutput';
import { AgentOutputParser } from '../lib/agentOutputParser';

export function useAgentOutput(): void {
  const sessionTypes = useSessionStore((s) => s.sessionTypes);
  const panelOpen = useAgentOutputStore((s) => s.panelOpen);
  const addBlocks = useAgentOutputStore((s) => s.addBlocks);
  const parsers = useRef<Map<string, AgentOutputParser>>(new Map());

  useEffect(() => {
    // Only active when panel is open
    if (!panelOpen) return;

    const unlisteners: Array<() => void> = [];

    // Find all Claude sessions
    const claudeSessionIds = Object.entries(sessionTypes)
      .filter(([, entry]) => entry.type === 'claude')
      .map(([id]) => id);

    for (const sessionId of claudeSessionIds) {
      // Create parser if not exists
      if (!parsers.current.has(sessionId)) {
        parsers.current.set(sessionId, new AgentOutputParser(sessionId));
      }
      const parser = parsers.current.get(sessionId)!;

      // Subscribe to PTY output
      listen<string>(`pty-output-${sessionId}`, (event) => {
        const blocks = parser.parse(event.payload);
        if (blocks.length > 0) {
          addBlocks(sessionId, blocks);
        }
      }).then((unlisten) => {
        unlisteners.push(unlisten);
      });
    }

    // Clean up parsers for sessions that are no longer Claude
    for (const [id] of parsers.current) {
      if (!claudeSessionIds.includes(id)) {
        parsers.current.get(id)?.reset();
        parsers.current.delete(id);
      }
    }

    return () => {
      for (const unlisten of unlisteners) {
        unlisten();
      }
    };
  }, [sessionTypes, panelOpen, addBlocks]);
}

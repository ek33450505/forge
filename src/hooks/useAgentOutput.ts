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

    let cancelled = false;
    const unlisteners: Array<() => void> = [];

    // Find all AI tool sessions (not shell or unknown)
    const AI_TYPES = ['claude-code', 'aider', 'ollama', 'codex', 'open-interpreter', 'cursor-cli'] as const;
    const claudeSessionIds = Object.entries(sessionTypes)
      .filter(([, entry]) => AI_TYPES.includes(entry.type as typeof AI_TYPES[number]))
      .map(([id]) => id);

    // Use an async IIFE so we can await all listen() calls before returning.
    // Without this, a fast cleanup (effect re-run) would call the cleanup
    // function before unlisteners was populated, leaking Tauri event listeners.
    // Those orphaned listeners then crash with "listeners[eventId].handlerId"
    // when the Tauri runtime tries to clean them up on the next listen() call
    // for the same event channel.
    (async () => {
      for (const sessionId of claudeSessionIds) {
        // Create parser if not exists
        if (!parsers.current.has(sessionId)) {
          parsers.current.set(sessionId, new AgentOutputParser(sessionId));
        }
        const parser = parsers.current.get(sessionId)!;

        const unlisten = await listen<string>(`pty-output-${sessionId}`, (event) => {
          const blocks = parser.parse(event.payload);
          if (blocks.length > 0) {
            addBlocks(sessionId, blocks);
          }
        });

        if (cancelled) {
          // Effect was cleaned up while we were awaiting — unlisten immediately
          unlisten();
          return;
        }

        unlisteners.push(unlisten);
      }

      // Clean up parsers for sessions that are no longer Claude
      for (const [id] of parsers.current) {
        if (!claudeSessionIds.includes(id)) {
          parsers.current.get(id)?.reset();
          parsers.current.delete(id);
        }
      }
    })();

    return () => {
      cancelled = true;
      for (const unlisten of unlisteners) {
        unlisten();
      }
    };
  }, [sessionTypes, panelOpen, addBlocks]);
}

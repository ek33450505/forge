import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { listen } from '@tauri-apps/api/event';
import { useSessionStore } from '../store/sessions';
import type { SessionExitPayload } from '../types/ipc';

export function ToastNotifications() {
  // Use the sessions map directly — Object.keys() in a selector creates a new array each time
  const sessions = useSessionStore((s) => s.sessions);

  useEffect(() => {
    const unlisten: Array<() => void> = [];
    const sessionIds = Object.keys(sessions);

    for (const id of sessionIds) {
      listen<SessionExitPayload>(`session-exit-${id}`, (event) => {
        const name = useSessionStore.getState().sessions[id]?.name ?? id.slice(0, 8);
        toast.warning(`Session "${name}" exited`, {
          description: `Reason: ${event.payload.reason}`,
          duration: 5000,
        });
      }).then((fn) => unlisten.push(fn));
    }

    return () => unlisten.forEach((fn) => fn());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#1a1a2e',
          border: '1px solid #2a2a3e',
          color: '#e0e0e0',
        },
      }}
    />
  );
}

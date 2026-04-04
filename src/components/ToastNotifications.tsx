import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { listen } from '@tauri-apps/api/event';
import { useSessionStore } from '../store/sessions';
import type { SessionExitPayload } from '../types/ipc';

export function ToastNotifications() {
  // Direct property access — never method selectors
  const sessionIds = useSessionStore((s) => Object.keys(s.sessions));

  useEffect(() => {
    const unlisten: Array<() => void> = [];

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
  }, [sessionIds.join(',')]);

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

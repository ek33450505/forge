import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationSettingsState {
  paneNotifyEnabled: Record<string, boolean>;
  thresholdSeconds: number;
  togglePane: (paneId: string) => void;
  setThreshold: (s: number) => void;
}

export const useNotificationSettingsStore = create<NotificationSettingsState>()(
  persist(
    (set) => ({
      paneNotifyEnabled: {},
      thresholdSeconds: 10,
      togglePane(paneId) {
        set((state) => ({
          paneNotifyEnabled: {
            ...state.paneNotifyEnabled,
            [paneId]: !state.paneNotifyEnabled[paneId],
          },
        }));
      },
      setThreshold(s) {
        set({ thresholdSeconds: s });
      },
    }),
    { name: 'forge-notification-settings' },
  ),
);

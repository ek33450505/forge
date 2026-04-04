import { useEffect, useRef } from 'react';
import { useCastStore } from '../store/cast';

const POLL_INTERVAL_MS = 3000;

/**
 * Starts polling cast.db every 3 seconds when the feed is open.
 * Pauses automatically when feedOpen is false.
 * Call once at the App level.
 */
export function useCastData() {
  const feedOpen = useCastStore((s) => s.feedOpen);
  const available = useCastStore((s) => s.available);
  const refreshRuns = useCastStore((s) => s.refreshRuns);
  const refreshStats = useCastStore((s) => s.refreshStats);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!available || !feedOpen) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    // Immediate first fetch
    void refreshRuns();
    void refreshStats();
    intervalRef.current = setInterval(() => {
      void refreshRuns();
      void refreshStats();
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [available, feedOpen, refreshRuns, refreshStats]);
}

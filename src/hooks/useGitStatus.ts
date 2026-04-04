import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { GitStatus } from '../types/ipc';

const TTL_MS = 5000;

export function useGitStatus(cwd: string | null): GitStatus | null {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const cacheRef = useRef<{ cwd: string; result: GitStatus; ts: number } | null>(null);

  useEffect(() => {
    if (!cwd) {
      setStatus(null);
      return;
    }

    const now = Date.now();
    const cached = cacheRef.current;
    if (cached && cached.cwd === cwd && now - cached.ts < TTL_MS) {
      setStatus(cached.result);
      return;
    }

    invoke<GitStatus>('get_git_status', { cwd })
      .then((result) => {
        cacheRef.current = { cwd, result, ts: Date.now() };
        setStatus(result);
      })
      .catch(() => {
        setStatus(null);
      });
  }, [cwd]);

  return status;
}

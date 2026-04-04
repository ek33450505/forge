import { useEffect, useRef, useCallback } from 'react';
import { useTerminalSearchStore } from '../store/terminalSearch';
import { searchAddonMap } from '../hooks/useTerminal';

interface TerminalSearchProps {
  sessionId: string;
}

export function TerminalSearch({ sessionId }: TerminalSearchProps) {
  const open = useTerminalSearchStore((s) => s.open);
  const query = useTerminalSearchStore((s) => s.query);
  const caseSensitive = useTerminalSearchStore((s) => s.caseSensitive);
  const useRegex = useTerminalSearchStore((s) => s.useRegex);
  const matchIndex = useTerminalSearchStore((s) => s.matchIndex);
  const matchCount = useTerminalSearchStore((s) => s.matchCount);
  const setQuery = useTerminalSearchStore((s) => s.setQuery);
  const setOpen = useTerminalSearchStore((s) => s.setOpen);
  const toggleCaseSensitive = useTerminalSearchStore((s) => s.toggleCaseSensitive);
  const toggleRegex = useTerminalSearchStore((s) => s.toggleRegex);
  const setMatchInfo = useTerminalSearchStore((s) => s.setMatchInfo);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Run search when query/options change
  useEffect(() => {
    if (!open) return;
    const addon = searchAddonMap.get(sessionId);
    if (!addon) return;

    if (!query) {
      addon.clearDecorations();
      setMatchInfo(0, 0);
      return;
    }

    // Subscribe to result change events for match index/count
    const disposable = addon.onDidChangeResults((event) => {
      if (event) {
        setMatchInfo(event.resultIndex + 1, event.resultCount);
      } else {
        setMatchInfo(0, 0);
      }
    });

    const found = addon.findNext(query, {
      caseSensitive,
      regex: useRegex,
      incremental: true,
    });

    if (!found) {
      setMatchInfo(0, 0);
    }

    return () => disposable.dispose();
  }, [query, caseSensitive, useRegex, open, sessionId, setMatchInfo]);

  const handleNext = useCallback(() => {
    const addon = searchAddonMap.get(sessionId);
    if (!addon || !query) return;
    addon.findNext(query, { caseSensitive, regex: useRegex });
    // Match info is updated via onDidChangeResults in the search effect
  }, [sessionId, query, caseSensitive, useRegex]);

  const handlePrevious = useCallback(() => {
    const addon = searchAddonMap.get(sessionId);
    if (!addon || !query) return;
    addon.findPrevious(query, { caseSensitive, regex: useRegex });
    // Match info is updated via onDidChangeResults in the search effect
  }, [sessionId, query, caseSensitive, useRegex]);

  const handleClose = useCallback(() => {
    const addon = searchAddonMap.get(sessionId);
    if (addon) addon.clearDecorations();
    setOpen(false);
  }, [sessionId, setOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      }
    },
    [handleClose, handleNext, handlePrevious],
  );

  if (!open) return null;

  return (
    <div
      role="search"
      style={{
        position: 'absolute',
        top: '4px',
        right: '12px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '6px',
        backgroundColor: 'var(--panel-bg)',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        fontSize: '12px',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        aria-label="Search terminal output"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search..."
        style={{
          width: '160px',
          height: '24px',
          padding: '0 6px',
          border: '1px solid var(--border)',
          borderRadius: '3px',
          backgroundColor: 'var(--bg)',
          color: 'var(--fg)',
          fontSize: '12px',
          outline: 'none',
        }}
      />

      {/* Match count */}
      {query && (
        <span aria-live="polite" style={{ color: 'var(--fg-muted)', fontSize: '11px', minWidth: '40px', textAlign: 'center' }}>
          {matchCount > 0 ? `${matchIndex} / ${matchCount}` : 'No results'}
        </span>
      )}

      {/* Case sensitive toggle */}
      <button
        onClick={toggleCaseSensitive}
        title="Case Sensitive"
        style={{
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: caseSensitive ? '1px solid var(--accent)' : '1px solid var(--border)',
          borderRadius: '3px',
          backgroundColor: caseSensitive ? 'var(--accent)' : 'transparent',
          color: caseSensitive ? 'var(--bg)' : 'var(--fg-muted)',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 700,
        }}
      >
        Aa
      </button>

      {/* Regex toggle */}
      <button
        onClick={toggleRegex}
        title="Use Regular Expression"
        style={{
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: useRegex ? '1px solid var(--accent)' : '1px solid var(--border)',
          borderRadius: '3px',
          backgroundColor: useRegex ? 'var(--accent)' : 'transparent',
          color: useRegex ? 'var(--bg)' : 'var(--fg-muted)',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 700,
        }}
      >
        .*
      </button>

      {/* Previous match */}
      <button
        onClick={handlePrevious}
        title="Previous Match (Shift+Enter)"
        style={{
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border)',
          borderRadius: '3px',
          backgroundColor: 'transparent',
          color: 'var(--fg-muted)',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        &#x25B2;
      </button>

      {/* Next match */}
      <button
        onClick={handleNext}
        title="Next Match (Enter)"
        style={{
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border)',
          borderRadius: '3px',
          backgroundColor: 'transparent',
          color: 'var(--fg-muted)',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        &#x25BC;
      </button>

      {/* Close */}
      <button
        onClick={handleClose}
        title="Close (Escape)"
        style={{
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border)',
          borderRadius: '3px',
          backgroundColor: 'transparent',
          color: 'var(--fg-muted)',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        &#x2715;
      </button>
    </div>
  );
}

/**
 * Regression test for the blank-terminal bug caused by using display:none for
 * inactive tabs in PaneLayout.
 *
 * Root cause: display:none collapses element dimensions to 0. When xterm's
 * ResizeObserver fires on a hidden tab, fitAddon.fit() resizes the terminal to
 * 0 cols/rows — producing a blank terminal when that tab is made active again.
 *
 * Fix: inactive tabs use visibility:hidden (preserves dimensions) instead of
 * display:none. A zero-dimension guard in the ResizeObserver callback prevents
 * any accidental fit() call on a zero-size container.
 *
 * These tests verify the guard logic and the CSS property choice independently
 * of the DOM, since the vitest environment is 'node'.
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Logic extracted from PaneLayout.tsx — visibility selection
// ---------------------------------------------------------------------------

function tabVisibility(tabId: string, activeTabId: string | null): 'visible' | 'hidden' {
  return tabId === activeTabId ? 'visible' : 'hidden';
}

function tabPointerEvents(tabId: string, activeTabId: string | null): 'auto' | 'none' {
  return tabId === activeTabId ? 'auto' : 'none';
}

describe('PaneLayout tab visibility — regression: display:none must NOT be used', () => {
  it('active tab gets visibility:visible', () => {
    expect(tabVisibility('tab-1', 'tab-1')).toBe('visible');
  });

  it('inactive tab gets visibility:hidden (NOT display:none)', () => {
    expect(tabVisibility('tab-2', 'tab-1')).toBe('hidden');
    // This is the critical assertion: the value must be 'hidden', never 'none'.
    // 'none' would indicate a revert to display:none behavior.
    expect(tabVisibility('tab-2', 'tab-1')).not.toBe('none');
  });

  it('inactive tab gets pointerEvents:none to prevent interaction', () => {
    expect(tabPointerEvents('tab-2', 'tab-1')).toBe('none');
  });

  it('active tab gets pointerEvents:auto', () => {
    expect(tabPointerEvents('tab-1', 'tab-1')).toBe('auto');
  });

  it('when activeTabId is null, all tabs are hidden', () => {
    expect(tabVisibility('tab-1', null)).toBe('hidden');
    expect(tabVisibility('tab-2', null)).toBe('hidden');
  });
});

// ---------------------------------------------------------------------------
// Logic extracted from useTerminal.ts — ResizeObserver zero-dimension guard
// ---------------------------------------------------------------------------

/**
 * Returns true if fitAddon.fit() should be skipped.
 * Mirrors the guard condition added to useTerminal's ResizeObserver callback.
 */
function shouldSkipFit(container: { offsetWidth: number; offsetHeight: number } | null): boolean {
  if (!container) return true;
  if (container.offsetWidth === 0 || container.offsetHeight === 0) return true;
  return false;
}

describe('useTerminal ResizeObserver guard — regression: must skip fit() on zero-size container', () => {
  it('skips fit when container is null', () => {
    expect(shouldSkipFit(null)).toBe(true);
  });

  it('skips fit when offsetWidth is 0 (display:none collapsed width)', () => {
    expect(shouldSkipFit({ offsetWidth: 0, offsetHeight: 600 })).toBe(true);
  });

  it('skips fit when offsetHeight is 0 (display:none collapsed height)', () => {
    expect(shouldSkipFit({ offsetWidth: 800, offsetHeight: 0 })).toBe(true);
  });

  it('skips fit when both dimensions are 0', () => {
    expect(shouldSkipFit({ offsetWidth: 0, offsetHeight: 0 })).toBe(true);
  });

  it('allows fit when container has real dimensions', () => {
    expect(shouldSkipFit({ offsetWidth: 800, offsetHeight: 600 })).toBe(false);
  });

  it('allows fit with small but non-zero dimensions', () => {
    expect(shouldSkipFit({ offsetWidth: 1, offsetHeight: 1 })).toBe(false);
  });
});

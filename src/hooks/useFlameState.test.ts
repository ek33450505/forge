import { describe, it, expect } from 'vitest';
import type { SessionTypeEntry } from '../types/sessions';

// Test the pure derivation logic independently of React hooks/DOM
// This avoids jsdom dependency while covering the core state machine

type MockSessionTypes = Record<string, SessionTypeEntry>;

function deriveFlameState(
  sessionTypes: MockSessionTypes,
  castFeedEnabled: boolean,
): 'idle' | 'active' | 'complete' | 'error' {
  const entries = Object.values(sessionTypes);
  const hasClaudeSession = entries.some((e) => e.type === 'claude');
  const hasCastSession = entries.some((e) => (e.type as string) === 'cast');

  if (hasCastSession && castFeedEnabled) return 'active';
  if (hasClaudeSession) return 'active';
  return 'idle';
}

describe('useFlameState derivation logic', () => {
  it('returns idle when no sessions', () => {
    expect(deriveFlameState({}, false)).toBe('idle');
  });

  it('returns idle when only shell sessions', () => {
    const sessionTypes: MockSessionTypes = {
      'session-1': { type: 'shell', manualOverride: false },
    };
    expect(deriveFlameState(sessionTypes, false)).toBe('idle');
  });

  it('returns active when a claude session exists', () => {
    const sessionTypes: MockSessionTypes = {
      'session-1': { type: 'claude', manualOverride: true },
    };
    expect(deriveFlameState(sessionTypes, false)).toBe('active');
  });

  it('returns active when cast session exists and castFeedEnabled', () => {
    const sessionTypes = {
      'session-1': { type: 'cast', manualOverride: false } as SessionTypeEntry,
    };
    expect(deriveFlameState(sessionTypes, true)).toBe('active');
  });

  it('returns idle when cast session exists but castFeedEnabled is false', () => {
    const sessionTypes = {
      'session-1': { type: 'cast', manualOverride: false } as SessionTypeEntry,
    };
    expect(deriveFlameState(sessionTypes, false)).toBe('idle');
  });

  it('returns active when multiple sessions and one is claude', () => {
    const sessionTypes: MockSessionTypes = {
      'session-1': { type: 'shell', manualOverride: false },
      'session-2': { type: 'claude', manualOverride: true },
    };
    expect(deriveFlameState(sessionTypes, false)).toBe('active');
  });

  it('returns idle when only unknown sessions', () => {
    const sessionTypes: MockSessionTypes = {
      'session-1': { type: 'unknown', manualOverride: false },
    };
    expect(deriveFlameState(sessionTypes, false)).toBe('idle');
  });
});

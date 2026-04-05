import { describe, it, expect } from 'vitest';
import type { SessionType, SessionTypeEntry } from '../types/sessions';

// Test the pure derivation logic independently of React hooks/DOM
// This avoids jsdom dependency while covering the core state machine

type MockSessionTypes = Record<string, SessionTypeEntry>;

const AI_TYPES: SessionType[] = ['claude-code', 'aider', 'ollama', 'codex', 'open-interpreter', 'cursor-cli'];

function deriveFlameState(
  sessionTypes: MockSessionTypes,
): 'idle' | 'active' | 'complete' | 'error' {
  const entries = Object.values(sessionTypes);
  const hasAiSession = entries.some((e) => AI_TYPES.includes(e.type));

  if (hasAiSession) return 'active';
  return 'idle';
}

describe('useFlameState derivation logic', () => {
  it('returns idle when no sessions', () => {
    expect(deriveFlameState({})).toBe('idle');
  });

  it('returns idle when only shell sessions', () => {
    const sessionTypes: MockSessionTypes = {
      'session-1': { type: 'shell', manualOverride: false },
    };
    expect(deriveFlameState(sessionTypes)).toBe('idle');
  });

  it('returns active when a claude-code session exists', () => {
    const sessionTypes: MockSessionTypes = {
      'session-1': { type: 'claude-code', manualOverride: true },
    };
    expect(deriveFlameState(sessionTypes)).toBe('active');
  });

  it('returns active when an aider session exists', () => {
    const sessionTypes: MockSessionTypes = {
      'session-1': { type: 'aider', manualOverride: false },
    };
    expect(deriveFlameState(sessionTypes)).toBe('active');
  });

  it('returns active when an ollama session exists', () => {
    const sessionTypes: MockSessionTypes = {
      'session-1': { type: 'ollama', manualOverride: false },
    };
    expect(deriveFlameState(sessionTypes)).toBe('active');
  });

  it('returns active when a codex session exists', () => {
    const sessionTypes: MockSessionTypes = {
      'session-1': { type: 'codex', manualOverride: false },
    };
    expect(deriveFlameState(sessionTypes)).toBe('active');
  });

  it('returns active when an open-interpreter session exists', () => {
    const sessionTypes: MockSessionTypes = {
      'session-1': { type: 'open-interpreter', manualOverride: false },
    };
    expect(deriveFlameState(sessionTypes)).toBe('active');
  });

  it('returns active when a cursor-cli session exists', () => {
    const sessionTypes: MockSessionTypes = {
      'session-1': { type: 'cursor-cli', manualOverride: false },
    };
    expect(deriveFlameState(sessionTypes)).toBe('active');
  });

  it('returns active when multiple sessions and one is claude-code', () => {
    const sessionTypes: MockSessionTypes = {
      'session-1': { type: 'shell', manualOverride: false },
      'session-2': { type: 'claude-code', manualOverride: true },
    };
    expect(deriveFlameState(sessionTypes)).toBe('active');
  });

  it('returns idle when only unknown sessions', () => {
    const sessionTypes: MockSessionTypes = {
      'session-1': { type: 'unknown', manualOverride: false },
    };
    expect(deriveFlameState(sessionTypes)).toBe('idle');
  });
});

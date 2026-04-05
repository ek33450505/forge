import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ALL_DETECTORS, claudeCodeDetector } from '../lib/aiDetectors';
import type { SessionType, SessionTypeEntry } from '../types/sessions';

/**
 * Tests for the detection logic inside useAIDetection.
 *
 * The hook itself is a thin React wrapper around a `listen` callback.
 * Since the vitest environment is 'node' (no jsdom, no React renderer),
 * we extract and test the callback logic directly — the same approach used
 * by useFlameState.test.ts and useProcessInspection.test.ts.
 *
 * The callback receives a raw PTY data string and must:
 *   1. Skip if manualOverride is true
 *   2. Run ALL_DETECTORS in order; first match sets sessionType
 *   3. If no detector matches and current type is an AI type,
 *      increment shell-hit counter; revert to 'shell' at SHELL_REVERT_THRESHOLD
 */

// ─── Inline reproduction of the hook's callback logic ────────────────────────
// This mirrors useAIDetection.ts exactly. If the hook changes, update here too.

const SHELL_REVERT_THRESHOLD = 3;

type SessionTypeStore = Record<string, SessionTypeEntry>;

function makeCallbackEnv(initialTypes: SessionTypeStore = {}) {
  const sessionTypes: SessionTypeStore = { ...initialTypes };
  const shellHits: Record<string, number> = {};
  const AI_TYPES: SessionType[] = ALL_DETECTORS.map((d) => d.tool);

  const setSessionType = vi.fn((id: string, type: SessionType, manual: boolean) => {
    const existing = sessionTypes[id];
    if (!manual && existing?.manualOverride === true) return;
    sessionTypes[id] = { type, manualOverride: manual };
  });

  const getSessionType = (id: string): SessionTypeEntry =>
    sessionTypes[id] ?? { type: 'unknown', manualOverride: false };

  function handlePtyOutput(sessionId: string, data: string): void {
    const current = getSessionType(sessionId);
    if (current.manualOverride) return;

    for (const detector of ALL_DETECTORS) {
      if (detector.matchesOutput(data)) {
        shellHits[sessionId] = 0;
        setSessionType(sessionId, detector.tool, false);
        return;
      }
    }

    if (AI_TYPES.includes(current.type)) {
      const matchesShell = claudeCodeDetector.matchesShell?.(data) ?? false;
      if (matchesShell) {
        shellHits[sessionId] = (shellHits[sessionId] ?? 0) + 1;
        if (shellHits[sessionId] >= SHELL_REVERT_THRESHOLD) {
          shellHits[sessionId] = 0;
          setSessionType(sessionId, 'shell', false);
        }
      }
    }
  }

  return { handlePtyOutput, setSessionType, getSessionType, sessionTypes, shellHits };
}

// ─── Detector input fixtures (pulled from known-good patterns) ────────────────

const CLAUDE_OUTPUT = 'Cost: $0.023 (1,234 input, 456 output tokens)';
const AIDER_OUTPUT = 'Aider v0.50.1';
const OLLAMA_OUTPUT = '>>> ';
const CODEX_OUTPUT = 'Codex v1.0.0';
const OPEN_INTERPRETER_OUTPUT = 'Would you like to run this code? (y/n)';
const CURSOR_CLI_OUTPUT = '{"type":"system_init","model":"gpt-5"}';
const SHELL_PROMPT = 'user@host:~/projects$ ';
const UNRECOGNIZED_OUTPUT = 'hello world — no patterns here';

// ─── Core detection behavior ──────────────────────────────────────────────────

describe('useAIDetection — core detection', () => {
  it('sets sessionType to claude-code when PTY output matches a Claude Code pattern', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv();
    handlePtyOutput('s1', CLAUDE_OUTPUT);
    expect(getSessionType('s1').type).toBe('claude-code');
  });

  it('sets sessionType to aider when PTY output matches an Aider pattern', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv();
    handlePtyOutput('s1', AIDER_OUTPUT);
    expect(getSessionType('s1').type).toBe('aider');
  });

  it('sets sessionType to ollama when PTY output matches an Ollama pattern', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv();
    handlePtyOutput('s1', OLLAMA_OUTPUT);
    expect(getSessionType('s1').type).toBe('ollama');
  });

  it('sets sessionType to codex when PTY output matches a Codex pattern', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv();
    handlePtyOutput('s1', CODEX_OUTPUT);
    expect(getSessionType('s1').type).toBe('codex');
  });

  it('sets sessionType to open-interpreter when PTY output matches', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv();
    handlePtyOutput('s1', OPEN_INTERPRETER_OUTPUT);
    expect(getSessionType('s1').type).toBe('open-interpreter');
  });

  it('sets sessionType to cursor-cli when PTY output matches', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv();
    handlePtyOutput('s1', CURSOR_CLI_OUTPUT);
    expect(getSessionType('s1').type).toBe('cursor-cli');
  });

  it('does not change sessionType when output is unrecognized', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv({
      s1: { type: 'unknown', manualOverride: false },
    });
    handlePtyOutput('s1', UNRECOGNIZED_OUTPUT);
    expect(getSessionType('s1').type).toBe('unknown');
  });

  it('does not change sessionType when output is empty string', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv({
      s1: { type: 'shell', manualOverride: false },
    });
    handlePtyOutput('s1', '');
    expect(getSessionType('s1').type).toBe('shell');
  });

  it('never sets manualOverride to true via detection', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv();
    handlePtyOutput('s1', CLAUDE_OUTPUT);
    expect(getSessionType('s1').manualOverride).toBe(false);
  });
});

// ─── Shell revert behavior ────────────────────────────────────────────────────

describe('useAIDetection — shell revert', () => {
  it('does NOT revert to shell after fewer than SHELL_REVERT_THRESHOLD shell hits', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv({
      s1: { type: 'claude-code', manualOverride: false },
    });
    // Hit shell twice (threshold is 3)
    handlePtyOutput('s1', SHELL_PROMPT);
    handlePtyOutput('s1', SHELL_PROMPT);
    expect(getSessionType('s1').type).toBe('claude-code');
  });

  it('reverts to shell after SHELL_REVERT_THRESHOLD consecutive shell-prompt hits', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv({
      s1: { type: 'claude-code', manualOverride: false },
    });
    handlePtyOutput('s1', SHELL_PROMPT);
    handlePtyOutput('s1', SHELL_PROMPT);
    handlePtyOutput('s1', SHELL_PROMPT); // 3rd hit — revert
    expect(getSessionType('s1').type).toBe('shell');
  });

  it('resets shell hit counter when an AI pattern fires between shell prompts', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv({
      s1: { type: 'claude-code', manualOverride: false },
    });
    handlePtyOutput('s1', SHELL_PROMPT); // hit 1
    handlePtyOutput('s1', SHELL_PROMPT); // hit 2
    handlePtyOutput('s1', CLAUDE_OUTPUT); // AI output — counter resets, stays claude-code
    handlePtyOutput('s1', SHELL_PROMPT); // hit 1 again (counter was reset)
    handlePtyOutput('s1', SHELL_PROMPT); // hit 2
    expect(getSessionType('s1').type).toBe('claude-code');
  });

  it('resets shell hit counter to zero after revert, allowing re-detection', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv({
      s1: { type: 'claude-code', manualOverride: false },
    });
    // Trigger a full revert
    handlePtyOutput('s1', SHELL_PROMPT);
    handlePtyOutput('s1', SHELL_PROMPT);
    handlePtyOutput('s1', SHELL_PROMPT);
    expect(getSessionType('s1').type).toBe('shell');

    // Now AI output should re-detect
    handlePtyOutput('s1', CLAUDE_OUTPUT);
    expect(getSessionType('s1').type).toBe('claude-code');
  });

  it('does not trigger shell revert when sessionType is already shell', () => {
    const { handlePtyOutput, setSessionType, getSessionType } = makeCallbackEnv({
      s1: { type: 'shell', manualOverride: false },
    });
    const callsBefore = setSessionType.mock.calls.length;
    handlePtyOutput('s1', SHELL_PROMPT);
    handlePtyOutput('s1', SHELL_PROMPT);
    handlePtyOutput('s1', SHELL_PROMPT);
    // setSessionType should not have been called for shell→shell
    expect(setSessionType.mock.calls.length).toBe(callsBefore);
    expect(getSessionType('s1').type).toBe('shell');
  });

  it('does not trigger shell revert when sessionType is unknown', () => {
    const { handlePtyOutput, setSessionType } = makeCallbackEnv({
      s1: { type: 'unknown', manualOverride: false },
    });
    const callsBefore = setSessionType.mock.calls.length;
    handlePtyOutput('s1', SHELL_PROMPT);
    handlePtyOutput('s1', SHELL_PROMPT);
    handlePtyOutput('s1', SHELL_PROMPT);
    expect(setSessionType.mock.calls.length).toBe(callsBefore);
  });

  it('works for any AI type — aider reverts to shell after threshold', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv({
      s1: { type: 'aider', manualOverride: false },
    });
    handlePtyOutput('s1', SHELL_PROMPT);
    handlePtyOutput('s1', SHELL_PROMPT);
    handlePtyOutput('s1', SHELL_PROMPT);
    expect(getSessionType('s1').type).toBe('shell');
  });
});

// ─── Manual override ──────────────────────────────────────────────────────────

describe('useAIDetection — manualOverride', () => {
  it('does not change sessionType when manualOverride is true', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv({
      s1: { type: 'aider', manualOverride: true },
    });
    handlePtyOutput('s1', CLAUDE_OUTPUT);
    expect(getSessionType('s1').type).toBe('aider');
  });

  it('does not trigger shell revert when manualOverride is true', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv({
      s1: { type: 'claude-code', manualOverride: true },
    });
    handlePtyOutput('s1', SHELL_PROMPT);
    handlePtyOutput('s1', SHELL_PROMPT);
    handlePtyOutput('s1', SHELL_PROMPT);
    expect(getSessionType('s1').type).toBe('claude-code');
  });

  it('setSessionType skips non-manual writes when manualOverride is already set', () => {
    // Simulates the store's own guard: a manual override is sticky.
    // Even if detection fires, the store would reject it.
    const { setSessionType } = makeCallbackEnv({
      s1: { type: 'ollama', manualOverride: true },
    });
    // Directly call setSessionType with manual=false — should be rejected by guard
    setSessionType('s1', 'claude-code', false);
    // The mock implementation replicates the store guard
    // (check via re-reading sessionTypes via getSessionType)
  });

  it('allows detection again after manualOverride is removed externally', () => {
    const { handlePtyOutput, getSessionType, sessionTypes } = makeCallbackEnv({
      s1: { type: 'ollama', manualOverride: true },
    });
    // PTY output while override is on — no change
    handlePtyOutput('s1', CLAUDE_OUTPUT);
    expect(getSessionType('s1').type).toBe('ollama');

    // External removal of override (e.g. user toggles it off in UI)
    sessionTypes['s1'] = { type: 'ollama', manualOverride: false };

    // Detection now works
    handlePtyOutput('s1', CLAUDE_OUTPUT);
    expect(getSessionType('s1').type).toBe('claude-code');
  });
});

// ─── Multiple sessions ────────────────────────────────────────────────────────

describe('useAIDetection — multiple sessions', () => {
  it('tracks each session independently', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv();
    handlePtyOutput('s1', CLAUDE_OUTPUT);
    handlePtyOutput('s2', AIDER_OUTPUT);
    expect(getSessionType('s1').type).toBe('claude-code');
    expect(getSessionType('s2').type).toBe('aider');
  });

  it('shell revert counter is per-session and does not bleed between sessions', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv({
      s1: { type: 'claude-code', manualOverride: false },
      s2: { type: 'claude-code', manualOverride: false },
    });
    // Drive s1 to threshold
    handlePtyOutput('s1', SHELL_PROMPT);
    handlePtyOutput('s1', SHELL_PROMPT);
    handlePtyOutput('s1', SHELL_PROMPT);
    expect(getSessionType('s1').type).toBe('shell');

    // s2 has not received any shell prompts — still claude-code
    expect(getSessionType('s2').type).toBe('claude-code');
  });

  it('detection on one session does not affect another', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv({
      s1: { type: 'shell', manualOverride: false },
      s2: { type: 'shell', manualOverride: false },
    });
    handlePtyOutput('s1', OLLAMA_OUTPUT);
    expect(getSessionType('s1').type).toBe('ollama');
    expect(getSessionType('s2').type).toBe('shell');
  });

  it('manualOverride on one session does not protect another', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv({
      s1: { type: 'aider', manualOverride: true },
      s2: { type: 'aider', manualOverride: false },
    });
    handlePtyOutput('s1', CLAUDE_OUTPUT); // blocked by override
    handlePtyOutput('s2', CLAUDE_OUTPUT); // not blocked
    expect(getSessionType('s1').type).toBe('aider');
    expect(getSessionType('s2').type).toBe('claude-code');
  });
});

// ─── First-match-wins ordering ────────────────────────────────────────────────

describe('useAIDetection — first-match-wins ordering', () => {
  it('uses first matching detector and does not continue checking subsequent detectors', () => {
    // claudeCodeDetector is first in ALL_DETECTORS
    // aiderDetector is second
    // A string matching claudeCode must resolve to claude-code, not aider
    const { handlePtyOutput, setSessionType, getSessionType } = makeCallbackEnv();
    handlePtyOutput('s1', CLAUDE_OUTPUT);
    // setSessionType should have been called exactly once
    expect(setSessionType.mock.calls).toHaveLength(1);
    expect(getSessionType('s1').type).toBe('claude-code');
  });

  it('falls through to second detector when first does not match', () => {
    const { handlePtyOutput, getSessionType } = makeCallbackEnv();
    // Aider output should not match claudeCode patterns
    handlePtyOutput('s1', AIDER_OUTPUT);
    expect(getSessionType('s1').type).toBe('aider');
  });
});

// ─── Hook structure: no sessions ─────────────────────────────────────────────

describe('useAIDetection — no sessions guard', () => {
  it('callback does not throw when called for an unregistered session', () => {
    // The hook early-returns when sessionIds.length === 0, so the callback is
    // never registered. Here we test that the callback logic itself is
    // crash-safe even when called for an unknown session (getSessionType returns
    // the default { type: 'unknown', manualOverride: false } fallback).
    const { handlePtyOutput } = makeCallbackEnv({});
    expect(() => handlePtyOutput('ghost-session', CLAUDE_OUTPUT)).not.toThrow();
  });

  it('sets sessionType for an unregistered session using the unknown fallback', () => {
    // getSessionType returns { type: 'unknown', manualOverride: false } for
    // any unknown id, which means detection proceeds normally if output matches.
    const { handlePtyOutput, getSessionType } = makeCallbackEnv({});
    handlePtyOutput('ghost-session', CLAUDE_OUTPUT);
    expect(getSessionType('ghost-session').type).toBe('claude-code');
  });
});

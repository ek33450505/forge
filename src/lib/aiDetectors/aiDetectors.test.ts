import { describe, it, expect } from 'vitest';
import { claudeCodeDetector } from './claudeCode';
import { aiderDetector } from './aider';
import { ollamaDetector } from './ollama';
import { codexDetector } from './codex';
import { openInterpreterDetector } from './openInterpreter';
import { cursorCliDetector } from './cursorCli';
import { ALL_DETECTORS } from './index';

// ─── claudeCode ───────────────────────────────────────────────────────────────

describe('claudeCodeDetector', () => {
  it('matches cost line', () => {
    expect(claudeCodeDetector.matchesOutput('Cost: $0.023 (1,234 input, 456 output tokens)')).toBe(true);
  });

  it('matches tool call format', () => {
    expect(claudeCodeDetector.matchesOutput('Bash(ls -la)...')).toBe(true);
  });

  it('matches Esc to interrupt', () => {
    expect(claudeCodeDetector.matchesOutput('Press Esc to interrupt the current operation')).toBe(true);
  });

  it('does not match plain shell output', () => {
    expect(claudeCodeDetector.matchesOutput('total 32\ndrwxr-xr-x  5 user group 160 Apr 4 12:00 .')).toBe(false);
  });

  it('does not match empty string', () => {
    expect(claudeCodeDetector.matchesOutput('')).toBe(false);
  });

  it('matchesShell detects $ prompt', () => {
    expect(claudeCodeDetector.matchesShell?.('user@host:~/projects$ ')).toBe(true);
  });

  it('matchesShell detects ❯ prompt', () => {
    expect(claudeCodeDetector.matchesShell?.('~/projects ❯ ')).toBe(true);
  });

  it('matchesShell returns false for non-shell output', () => {
    expect(claudeCodeDetector.matchesShell?.('Cost: $0.01')).toBe(false);
  });
});

// ─── aider ────────────────────────────────────────────────────────────────────

describe('aiderDetector', () => {
  it('matches Tokens line', () => {
    expect(aiderDetector.matchesOutput('Tokens: 1.2k sent, 359 received. Cost: $0.0042 message, $0.012 session.')).toBe(true);
  });

  it('matches Aider version header', () => {
    expect(aiderDetector.matchesOutput('Aider v0.50.1')).toBe(true);
  });

  it('matches cost per message line', () => {
    expect(aiderDetector.matchesOutput('Cost: $0.005 message, $0.021 session')).toBe(true);
  });

  it('does not match Claude Code cost line', () => {
    expect(aiderDetector.matchesOutput('Cost: $0.023 (1,234 input, 456 output tokens)')).toBe(false);
  });

  it('does not match plain shell output', () => {
    expect(aiderDetector.matchesOutput('~/projects$ git status')).toBe(false);
  });

  it('does not match empty string', () => {
    expect(aiderDetector.matchesOutput('')).toBe(false);
  });
});

// ─── ollama ───────────────────────────────────────────────────────────────────

describe('ollamaDetector', () => {
  it('matches JSON streaming response', () => {
    expect(ollamaDetector.matchesOutput('{"model":"llama3.2","created_at":"2024-01-01T00:00:00Z","response":"hello","done":false}')).toBe(true);
  });

  it('matches done:true eval_count line', () => {
    expect(ollamaDetector.matchesOutput('{"done":true,"eval_count":42,"total_duration":1234}')).toBe(true);
  });

  it('matches interactive >>> prompt', () => {
    expect(ollamaDetector.matchesOutput('>>> ')).toBe(true);
  });

  it('does not match arbitrary JSON', () => {
    expect(ollamaDetector.matchesOutput('{"status":"ok","data":[]}')).toBe(false);
  });

  it('does not match empty string', () => {
    expect(ollamaDetector.matchesOutput('')).toBe(false);
  });
});

// ─── codex ────────────────────────────────────────────────────────────────────

describe('codexDetector', () => {
  it('matches Codex startup header', () => {
    expect(codexDetector.matchesOutput('Codex v1.0.0')).toBe(true);
  });

  it('matches openai model reference', () => {
    expect(codexDetector.matchesOutput('Model: openai/gpt-4o')).toBe(true);
  });

  it('matches tool call format', () => {
    expect(codexDetector.matchesOutput('Read(src/index.ts)...')).toBe(true);
  });

  it('does not match plain shell output', () => {
    expect(codexDetector.matchesOutput('~/projects$ ls')).toBe(false);
  });

  it('does not match empty string', () => {
    expect(codexDetector.matchesOutput('')).toBe(false);
  });
});

// ─── openInterpreter ──────────────────────────────────────────────────────────

describe('openInterpreterDetector', () => {
  it('matches run code prompt', () => {
    expect(openInterpreterDetector.matchesOutput('Would you like to run this code? (y/n)')).toBe(true);
  });

  it('matches Open Interpreter header', () => {
    expect(openInterpreterDetector.matchesOutput('Open Interpreter 0.2.0')).toBe(true);
  });

  it('matches model context line', () => {
    expect(openInterpreterDetector.matchesOutput('Model: gpt-4 | Context Window: 8192')).toBe(true);
  });

  it('does not match unrelated output', () => {
    expect(openInterpreterDetector.matchesOutput('Hello from the terminal')).toBe(false);
  });

  it('does not match empty string', () => {
    expect(openInterpreterDetector.matchesOutput('')).toBe(false);
  });
});

// ─── cursorCli ────────────────────────────────────────────────────────────────

describe('cursorCliDetector', () => {
  it('matches system_init JSON stream', () => {
    expect(cursorCliDetector.matchesOutput('{"type":"system_init","model":"gpt-5"}')).toBe(true);
  });

  it('matches content_delta JSON stream', () => {
    expect(cursorCliDetector.matchesOutput('{"type":"content_delta","delta":"hello"}')).toBe(true);
  });

  it('matches result JSON stream', () => {
    expect(cursorCliDetector.matchesOutput('{"type":"result","success":true}')).toBe(true);
  });

  it('matches Analyzing codebase line', () => {
    expect(cursorCliDetector.matchesOutput('Analyzing codebase...')).toBe(true);
  });

  it('does not match arbitrary JSON', () => {
    expect(cursorCliDetector.matchesOutput('{"status":"ok"}')).toBe(false);
  });

  it('does not match empty string', () => {
    expect(cursorCliDetector.matchesOutput('')).toBe(false);
  });
});

// ─── ALL_DETECTORS (detectAITool behavior) ────────────────────────────────────

describe('ALL_DETECTORS first-match wins', () => {
  const cases: Array<[string, string]> = [
    ['Cost: $0.023 (1,234 input, 456 output tokens)', 'claude-code'],
    ['Bash(ls -la)...', 'claude-code'],
    ['Tokens: 1.2k sent, 359 received.', 'aider'],
    ['Aider v0.50.1', 'aider'],
    ['{"model":"llama3.2","created_at":"2024-01-01T00:00:00Z","response":"hi","done":false}', 'ollama'],
    ['>>> ', 'ollama'],
    ['Codex v1.0.0', 'codex'],
    ['Would you like to run this code? (y/n)', 'open-interpreter'],
    ['Open Interpreter 0.2.0', 'open-interpreter'],
    ['{"type":"system_init","model":"gpt-5"}', 'cursor-cli'],
    ['{"type":"content_delta","delta":"x"}', 'cursor-cli'],
  ];

  for (const [input, expectedTool] of cases) {
    it(`detects ${expectedTool} for: ${input.slice(0, 50)}`, () => {
      const match = ALL_DETECTORS.find((d) => d.matchesOutput(input));
      expect(match?.tool).toBe(expectedTool);
    });
  }

  it('returns undefined for plain shell output', () => {
    const shellOutput = 'total 32\ndrwxr-xr-x  5 user group 160 .\n~/projects$ ';
    const match = ALL_DETECTORS.find((d) => d.matchesOutput(shellOutput));
    expect(match).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    const match = ALL_DETECTORS.find((d) => d.matchesOutput(''));
    expect(match).toBeUndefined();
  });
});

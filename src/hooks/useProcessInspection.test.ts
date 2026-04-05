import { describe, it, expect } from 'vitest';
import { detectToolFromProcessName } from './useProcessInspection';

describe('detectToolFromProcessName', () => {
  it("maps 'claude' to 'claude-code'", () => {
    expect(detectToolFromProcessName('claude')).toBe('claude-code');
  });

  it("maps 'node' to 'claude-code'", () => {
    expect(detectToolFromProcessName('node')).toBe('claude-code');
  });

  it("maps a full path containing 'ollama' to 'ollama'", () => {
    expect(detectToolFromProcessName('/usr/local/bin/ollama')).toBe('ollama');
  });

  it("maps 'aider' to 'aider'", () => {
    expect(detectToolFromProcessName('aider')).toBe('aider');
  });

  it("maps 'codex' to 'codex'", () => {
    expect(detectToolFromProcessName('codex')).toBe('codex');
  });

  it("maps 'interpreter' to 'open-interpreter'", () => {
    expect(detectToolFromProcessName('interpreter')).toBe('open-interpreter');
  });

  it("maps 'cursor-agent' to 'cursor-cli'", () => {
    expect(detectToolFromProcessName('cursor-agent')).toBe('cursor-cli');
  });

  it("maps 'bash' to 'shell'", () => {
    expect(detectToolFromProcessName('bash')).toBe('shell');
  });

  it("maps 'zsh' to 'shell'", () => {
    expect(detectToolFromProcessName('zsh')).toBe('shell');
  });

  it("maps 'python3' to 'shell' (not 'open-interpreter')", () => {
    expect(detectToolFromProcessName('python3')).toBe('shell');
  });

  it("maps empty string to 'shell'", () => {
    expect(detectToolFromProcessName('')).toBe('shell');
  });
});

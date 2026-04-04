import { describe, it, expect } from 'vitest';
import { matchesClaudePattern, matchesShellPattern } from './useClaudeDetection';

describe('matchesClaudePattern', () => {
  it('detects version string', () => {
    expect(matchesClaudePattern('Claude 3.7 Sonnet')).toBe(true);
  });
  it('detects function_calls XML', () => {
    expect(matchesClaudePattern('<function_calls>')).toBe(true);
  });
  it('detects tool_use keyword', () => {
    expect(matchesClaudePattern('using tool_use block')).toBe(true);
  });
  it('does not match common shell output', () => {
    expect(matchesClaudePattern('total 0\ndrwxr-xr-x  2 ed staff')).toBe(false);
    expect(matchesClaudePattern('npm install')).toBe(false);
    expect(matchesClaudePattern('echo hello')).toBe(false);
  });
});

describe('matchesShellPattern', () => {
  it('detects trailing dollar prompt', () => {
    expect(matchesShellPattern('ed@machine ~ $ ')).toBe(true);
  });
  it('detects zsh theme prompt', () => {
    expect(matchesShellPattern('~/projects ❯ ')).toBe(true);
  });
  it('does not match mid-line dollar', () => {
    expect(matchesShellPattern('costs $5.00')).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { errorPatterns, matchError, stripAnsi } from './errorPatterns';

describe('errorPatterns', () => {
  it('has exactly 10 patterns', () => {
    expect(errorPatterns).toHaveLength(10);
  });

  it('matches "Permission denied"', () => {
    expect(matchError('bash: /etc/shadow: Permission denied')).toBeTruthy();
    expect(matchError('all good here')).toBeNull();
  });

  it('matches "command not found"', () => {
    expect(matchError('zsh: command not found: foobar')).toBeTruthy();
    expect(matchError('command completed successfully')).toBeNull();
  });

  it('matches ENOENT / "No such file or directory"', () => {
    expect(matchError('Error: ENOENT: no such file')).toBeTruthy();
    expect(matchError('cat: /nonexistent: No such file or directory')).toBeTruthy();
    expect(matchError('file exists and is fine')).toBeNull();
  });

  it('matches npm ERR! / yarn error', () => {
    expect(matchError('npm ERR! code ERESOLVE')).toBeTruthy();
    expect(matchError('yarn error An unexpected error occurred')).toBeTruthy();
    expect(matchError('npm install completed')).toBeNull();
  });

  it('matches "Error: Cannot find module"', () => {
    expect(matchError("Error: Cannot find module 'express'")).toBeTruthy();
    expect(matchError('module loaded successfully')).toBeNull();
  });

  it('matches "SyntaxError:"', () => {
    expect(matchError('SyntaxError: Unexpected token')).toBeTruthy();
    expect(matchError('no errors found')).toBeNull();
  });

  it('matches Rust compile errors', () => {
    expect(matchError('error[E0308]: mismatched types')).toBeTruthy();
    expect(matchError('cargo error[E0001]')).toBeTruthy();
    expect(matchError('Compiling forge v0.1.0')).toBeNull();
  });

  it('matches exit status / exited with code', () => {
    expect(matchError('process exit status 1')).toBeTruthy();
    expect(matchError('exited with code 2')).toBeTruthy();
    expect(matchError('exit status 0')).toBeNull();
  });

  it('matches "fatal: not a git repository"', () => {
    expect(matchError('fatal: not a git repository (or any parent)')).toBeTruthy();
    expect(matchError('On branch main')).toBeNull();
  });

  it('matches SIGKILL / Killed', () => {
    expect(matchError('SIGKILL received')).toBeTruthy();
    expect(matchError('Killed')).toBeTruthy();
    expect(matchError('process running')).toBeNull();
  });
});

describe('stripAnsi', () => {
  it('removes ANSI escape codes', () => {
    expect(stripAnsi('\x1B[31mError\x1B[0m')).toBe('Error');
  });

  it('returns plain text unchanged', () => {
    expect(stripAnsi('hello world')).toBe('hello world');
  });
});

describe('matchError', () => {
  it('returns label and suggestion for matching output', () => {
    const result = matchError('Permission denied');
    expect(result).toEqual({
      label: 'Permission denied',
      suggestion: expect.stringContaining('sudo'),
    });
  });

  it('returns null for non-matching output', () => {
    expect(matchError('Everything is fine')).toBeNull();
  });

  it('strips ANSI before matching', () => {
    const result = matchError('\x1B[31mcommand not found\x1B[0m');
    expect(result).toBeTruthy();
    expect(result!.label).toBe('Command not found');
  });
});

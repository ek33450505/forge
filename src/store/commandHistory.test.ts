import { describe, it, expect, beforeEach } from 'vitest';
import { useCommandHistoryStore } from './commandHistory';

beforeEach(() => {
  useCommandHistoryStore.setState({ recentIds: [], shellHistory: [] });
});

describe('commandHistory store — getSuggestion', () => {
  it('returns most recent match for a prefix', () => {
    useCommandHistoryStore.getState().pushShellCommand('git status');
    useCommandHistoryStore.getState().pushShellCommand('git push');
    useCommandHistoryStore.getState().pushShellCommand('git stash');

    // Most recent 'git s' match should be 'git stash' (pushed last, at index 0)
    const suggestion = useCommandHistoryStore.getState().getSuggestion('git s');
    expect(suggestion).toBe('git stash');
  });

  it('returns null when no match', () => {
    useCommandHistoryStore.getState().pushShellCommand('npm install');
    useCommandHistoryStore.getState().pushShellCommand('npm run build');

    const suggestion = useCommandHistoryStore.getState().getSuggestion('git');
    expect(suggestion).toBeNull();
  });

  it('returns null for empty history', () => {
    expect(useCommandHistoryStore.getState().getSuggestion('git')).toBeNull();
  });

  it('returns null for empty prefix', () => {
    useCommandHistoryStore.getState().pushShellCommand('git status');
    expect(useCommandHistoryStore.getState().getSuggestion('')).toBeNull();
  });

  it('does not suggest the exact same string', () => {
    useCommandHistoryStore.getState().pushShellCommand('git status');
    expect(useCommandHistoryStore.getState().getSuggestion('git status')).toBeNull();
  });

  it('deduplicates shell commands (most recent wins)', () => {
    useCommandHistoryStore.getState().pushShellCommand('git status');
    useCommandHistoryStore.getState().pushShellCommand('git log');
    useCommandHistoryStore.getState().pushShellCommand('git status');

    const history = useCommandHistoryStore.getState().shellHistory;
    // 'git status' should appear only once, at index 0
    expect(history.filter((h) => h === 'git status')).toHaveLength(1);
    expect(history[0]).toBe('git status');
  });

  it('trims whitespace before storing', () => {
    useCommandHistoryStore.getState().pushShellCommand('  git status  ');
    const history = useCommandHistoryStore.getState().shellHistory;
    expect(history[0]).toBe('git status');
  });

  it('ignores empty/whitespace-only commands', () => {
    useCommandHistoryStore.getState().pushShellCommand('');
    useCommandHistoryStore.getState().pushShellCommand('   ');
    expect(useCommandHistoryStore.getState().shellHistory).toHaveLength(0);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { useErrorAnnotationStore } from './errorAnnotations';

beforeEach(() => {
  useErrorAnnotationStore.setState({ annotations: {} });
});

describe('errorAnnotations store', () => {
  const sessionId = 'test-session';

  it('push adds an annotation', () => {
    useErrorAnnotationStore.getState().push(sessionId, {
      label: 'Test error',
      suggestion: 'Fix it',
    });

    const annotations = useErrorAnnotationStore.getState().annotations[sessionId];
    expect(annotations).toHaveLength(1);
    expect(annotations![0].label).toBe('Test error');
    expect(annotations![0].suggestion).toBe('Fix it');
    expect(annotations![0].dismissed).toBe(false);
    expect(annotations![0].id).toBeTruthy();
    expect(annotations![0].timestamp).toBeGreaterThan(0);
  });

  it('dismiss sets dismissed to true', () => {
    useErrorAnnotationStore.getState().push(sessionId, {
      label: 'Error 1',
      suggestion: 'Suggestion 1',
    });

    const annotations = useErrorAnnotationStore.getState().annotations[sessionId]!;
    const id = annotations[0].id;

    useErrorAnnotationStore.getState().dismiss(sessionId, id);

    const updated = useErrorAnnotationStore.getState().annotations[sessionId]!;
    expect(updated[0].dismissed).toBe(true);
  });

  it('clearAll empties the list for a session', () => {
    useErrorAnnotationStore.getState().push(sessionId, {
      label: 'Error 1',
      suggestion: 'Suggestion 1',
    });
    useErrorAnnotationStore.getState().push(sessionId, {
      label: 'Error 2',
      suggestion: 'Suggestion 2',
    });

    useErrorAnnotationStore.getState().clearAll(sessionId);

    const annotations = useErrorAnnotationStore.getState().annotations[sessionId];
    expect(annotations).toEqual([]);
  });

  it('caps at 3 annotations, evicting oldest', () => {
    for (let i = 1; i <= 4; i++) {
      useErrorAnnotationStore.getState().push(sessionId, {
        label: `Error ${i}`,
        suggestion: `Suggestion ${i}`,
      });
    }

    const annotations = useErrorAnnotationStore.getState().annotations[sessionId]!;
    expect(annotations).toHaveLength(3);
    // Most recent should be first
    expect(annotations[0].label).toBe('Error 4');
    // Oldest (Error 1) should be evicted
    expect(annotations.find((a) => a.label === 'Error 1')).toBeUndefined();
  });

  it('does not affect other sessions', () => {
    useErrorAnnotationStore.getState().push('session-a', {
      label: 'Error A',
      suggestion: 'Suggestion A',
    });
    useErrorAnnotationStore.getState().push('session-b', {
      label: 'Error B',
      suggestion: 'Suggestion B',
    });

    useErrorAnnotationStore.getState().clearAll('session-a');

    expect(useErrorAnnotationStore.getState().annotations['session-a']).toEqual([]);
    expect(useErrorAnnotationStore.getState().annotations['session-b']).toHaveLength(1);
  });
});

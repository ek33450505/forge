import { useErrorAnnotationStore } from '../store/errorAnnotations';

interface ErrorAnnotationProps {
  sessionId: string;
}

export function ErrorAnnotation({ sessionId }: ErrorAnnotationProps) {
  // Select the whole annotation array for this session — .filter() inside a
  // selector returns a new array on every call which makes Zustand's Object.is
  // check always fail, causing an infinite re-render loop. Filter in render.
  const allAnnotations = useErrorAnnotationStore(
    (s) => s.annotations[sessionId] ?? null,
  );
  const dismiss = useErrorAnnotationStore((s) => s.dismiss);
  const annotations = allAnnotations ? allAnnotations.filter((a) => !a.dismissed) : [];

  if (annotations.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '4px',
        right: '12px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        maxWidth: '360px',
      }}
    >
      {annotations.map((ann) => (
        <div
          key={ann.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '6px 10px',
            borderRadius: '4px',
            borderLeft: '3px solid var(--warning, #f59e0b)',
            backgroundColor: 'var(--panel-bg)',
            border: '1px solid var(--border)',
            borderLeftWidth: '3px',
            borderLeftColor: 'var(--warning, #f59e0b)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            fontSize: '12px',
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ color: 'var(--fg)', fontWeight: 600, marginBottom: '2px' }}>
              {ann.label}
            </div>
            <div style={{ color: 'var(--fg-muted)', fontSize: '11px' }}>
              {ann.suggestion}
            </div>
          </div>
          <button
            onClick={() => dismiss(sessionId, ann.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--fg-muted)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '0 2px',
              lineHeight: 1,
              flexShrink: 0,
            }}
            title="Dismiss"
          >
            &#x2715;
          </button>
        </div>
      ))}
    </div>
  );
}

const HINTS = [
  { key: '⌘T', label: 'New Session' },
  { key: '⌘D', label: 'Split H' },
  { key: '⌘⇧D', label: 'Split V' },
  { key: '⌘W', label: 'Close Pane' },
  { key: '⌘[', label: 'Prev Pane' },
  { key: '⌘]', label: 'Next Pane' },
  { key: '⌘I', label: 'Info Panel' },
  { key: '⌘\\', label: 'Sidebar' },
];

interface ShortcutHintsProps {
  visible: boolean;
}

export function ShortcutHints({ visible }: ShortcutHintsProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        height: '20px',
        flexShrink: 0,
        backgroundColor: 'var(--tab-bar)',
        borderTop: '1px solid var(--card-border)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '8px',
        paddingRight: '8px',
        gap: '12px',
        fontSize: '10px',
        color: 'var(--text-subtle)',
        userSelect: 'none',
        overflowX: 'auto',
      }}
    >
      {HINTS.map(({ key, label }) => (
        <span key={key}>
          <kbd style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{key}</kbd>
          {' '}{label}
        </span>
      ))}
    </div>
  );
}

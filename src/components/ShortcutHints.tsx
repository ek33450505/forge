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
        backgroundColor: '#0a1020',
        borderTop: '1px solid #1e1e2e',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '8px',
        paddingRight: '8px',
        gap: '12px',
        fontSize: '10px',
        color: '#666688',
        userSelect: 'none',
        overflowX: 'auto',
      }}
    >
      {HINTS.map(({ key, label }) => (
        <span key={key}>
          <kbd style={{ color: '#aaaacc', fontFamily: 'monospace' }}>{key}</kbd>
          {' '}{label}
        </span>
      ))}
    </div>
  );
}

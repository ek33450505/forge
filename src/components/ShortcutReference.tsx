import { Fragment, useEffect, useRef } from 'react';

interface ShortcutEntry {
  key: string;
  label: string;
}

interface ShortcutGroup {
  heading: string;
  entries: ShortcutEntry[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    heading: 'Layout',
    entries: [
      { key: '⌘T',   label: 'New tab' },
      { key: '⌘W',   label: 'Close pane / tab' },
      { key: '⌘D',   label: 'Split horizontal' },
      { key: '⌘⇧D',  label: 'Split vertical' },
      { key: '⌘]',   label: 'Next pane' },
      { key: '⌘[',   label: 'Previous pane' },
      { key: '⌘1–9', label: 'Switch to pane N' },
    ],
  },
  {
    heading: 'Tools',
    entries: [
      { key: '⌘K',   label: 'Command palette' },
      { key: '⌘F',   label: 'Search terminal output' },
      { key: '⌘,',   label: 'Settings' },
      { key: '⌘/',   label: 'Keyboard shortcuts' },
      { key: '⌘I',   label: 'Info panel' },
      { key: '⌘⇧O',  label: 'Agent output panel' },
      { key: '⌘⇧A',  label: 'Toggle CAST feed' },
    ],
  },
  {
    heading: 'Terminal',
    entries: [
      { key: '⌘B', label: 'Toggle sidebar' },
    ],
  },
];

interface ShortcutReferenceProps {
  /** Whether the popover is visible */
  open: boolean;
  /** Called when the popover should close */
  onClose: () => void;
  /** Ref to the anchor button so we can position relative to it */
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export function ShortcutReference({ open, onClose, anchorRef }: ShortcutReferenceProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [open, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        anchorRef.current && !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Keyboard shortcuts"
      style={{
        position: 'fixed',
        bottom: '28px', // sits just above the 24px status bar with a bit of breathing room
        right: '8px',
        zIndex: 9000,
        width: '360px',
        maxHeight: '480px',
        overflowY: 'auto',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '6px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        fontFamily: 'inherit',
        fontSize: '12px',
        color: 'var(--fg)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid var(--card-border)',
          position: 'sticky',
          top: 0,
          backgroundColor: 'var(--card-bg)',
          zIndex: 1,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '12px', letterSpacing: '0.02em' }}>
          Keyboard Shortcuts
        </span>
        <button
          onClick={onClose}
          aria-label="Close shortcuts panel"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--status-bar-text)',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            padding: '0 2px',
          }}
        >
          ×
        </button>
      </div>

      {/* Groups */}
      <div style={{ padding: '8px 0' }}>
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.heading}>
            {/* Section header */}
            <div
              style={{
                padding: '4px 12px 3px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted, var(--status-bar-text))',
              }}
            >
              {group.heading}
            </div>

            {/* Entries grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                columnGap: '10px',
                rowGap: '1px',
                padding: '2px 12px 8px',
              }}
            >
              {group.entries.map(({ key, label }) => (
                <Fragment key={key}>
                  <kbd
                    style={{
                      display: 'inline-block',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      backgroundColor: 'var(--tab-bar)',
                      border: '1px solid var(--card-border)',
                      color: 'var(--fg)',
                      whiteSpace: 'nowrap',
                      lineHeight: '18px',
                      justifySelf: 'start',
                      alignSelf: 'center',
                    }}
                  >
                    {key}
                  </kbd>
                  <span
                    style={{
                      color: 'var(--status-bar-text)',
                      lineHeight: '20px',
                      alignSelf: 'center',
                    }}
                  >
                    {label}
                  </span>
                </Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

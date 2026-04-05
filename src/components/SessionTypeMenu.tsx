import { useEffect, useRef } from 'react';
import type { SessionType } from '../types/sessions';

interface SessionTypeMenuProps {
  /** The session ID this menu targets */
  sessionId: string;
  /** Current session type (for checkmark indicator) */
  currentType: SessionType;
  /** Screen position to anchor the menu */
  x: number;
  y: number;
  onSelect: (sessionId: string, type: SessionType) => void;
  onClose: () => void;
}

const MENU_OPTIONS: { type: SessionType; label: string }[] = [
  { type: 'shell',             label: 'Shell session'         },
  { type: 'claude-code',       label: 'Claude Code'           },
  { type: 'aider',             label: 'Aider'                 },
  { type: 'ollama',            label: 'Ollama'                },
  { type: 'codex',             label: 'OpenAI Codex CLI'      },
  { type: 'open-interpreter',  label: 'Open Interpreter'      },
  { type: 'cursor-cli',        label: 'Cursor CLI'            },
  { type: 'unknown',           label: 'Unknown'               },
];

export function SessionTypeMenu({
  sessionId,
  currentType,
  x,
  y,
  onSelect,
  onClose,
}: SessionTypeMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      {/* Full-screen transparent overlay to catch click-away */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
        }}
        onMouseDown={onClose}
      />

      {/* Menu panel */}
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          top: y,
          left: x,
          zIndex: 1000,
          backgroundColor: 'var(--modal-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '4px',
          minWidth: '150px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '4px 10px',
            fontSize: '10px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: '1px solid var(--card-border)',
          }}
        >
          Session type
        </div>
        {MENU_OPTIONS.map(({ type, label }) => {
          const isChecked = currentType === type;
          return (
            <div
              key={type}
              onMouseDown={(e) => {
                e.stopPropagation();
                onSelect(sessionId, type);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                color: isChecked ? 'var(--fg)' : 'var(--text-muted)',
                cursor: 'pointer',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--card-bg)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ width: '12px', flexShrink: 0, color: 'var(--claude-accent)' }}>
                {isChecked ? '✓' : ''}
              </span>
              {label}
            </div>
          );
        })}
      </div>
    </>
  );
}

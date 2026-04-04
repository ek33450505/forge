import { useEffect, useRef, useState } from 'react';
import {
  CommandRoot,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from 'cmdk';
import {
  getAllCommands,
  getCommand,
  type Command as ForgeCommand,
} from '../lib/commands';
import { useSessionStore } from '../store/sessions';
import { useCommandHistoryStore } from '../store/commandHistory';
import { useLayoutStore } from '../store/layout';

interface SessionSwitchCommand {
  id: string;
  label: string;
  group: 'Session';
  sessionId: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onExecute: (cmd: ForgeCommand | SessionSwitchCommand) => void;
}

const THEME = {
  backdrop: 'var(--modal-overlay)',
  bg: 'var(--modal-bg)',
  bgHover: 'var(--accent-soft)',
  text: 'var(--fg)',
  textMuted: 'var(--status-bar-text)',
  border: 'var(--border)',
  inputBg: 'var(--input-bg)',
  groupHeading: 'var(--status-bar-text)',
};

export function CommandPalette({ open, onClose, onExecute }: Props) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Safe Zustand selector — direct property access, never .getSession()
  const sessions = useSessionStore((s) => s.sessions);
  const recentIds = useCommandHistoryStore((s) => s.recentIds);

  // Focus input when palette opens
  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Keyboard trap: close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [open, onClose]);

  if (!open) return null;

  const allCommands = getAllCommands();
  const layoutCommands = allCommands.filter((c) => c.group === 'Layout');
  const settingsCommands = allCommands.filter((c) => c.group === 'Settings');

  // Resolve recent command ids to ForgeCommand objects
  const recentCommands: ForgeCommand[] = recentIds
    .map((id) => getCommand(id))
    .filter((c): c is ForgeCommand => c !== undefined);

  // Build session switch commands
  const sessionCommands: SessionSwitchCommand[] = Object.values(sessions).map((s) => ({
    id: `switch-session-${s.id}`,
    label: s.name ?? s.id,
    group: 'Session' as const,
    sessionId: s.id,
  }));

  function handleSessionSwitch(cmd: SessionSwitchCommand) {
    const state = useLayoutStore.getState();
    // Search all tabs to find the leaf, then switch to its tab + pane
    const allLeaves = state.getAllLeaves();
    const leaf = allLeaves.find((l) => l.sessionId === cmd.sessionId);
    if (leaf) {
      const targetTab = state.tabs.find((t) =>
        state.getAllLeaves().filter((l) =>
          // Re-collect for that specific tab's root
          collectLeavesFromTab(t).some((tl) => tl.id === leaf.id)
        ).length > 0
      );
      if (targetTab && targetTab.id !== state.activeTabId) {
        state.setActiveTab(targetTab.id);
      }
      state.setActivePane(leaf.id);
    }
    onClose();
  }

  // Helper to collect leaves from a single tab's root
  function collectLeavesFromTab(tab: { root: import('../store/layout').PaneNode }): import('../store/layout').LeafNode[] {
    function collect(node: import('../store/layout').PaneNode): import('../store/layout').LeafNode[] {
      if (node.type === 'leaf') return [node];
      return [...collect(node.children[0]), ...collect(node.children[1])];
    }
    return collect(tab.root);
  }

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '13px',
    color: THEME.text,
  };

  const keybindStyle: React.CSSProperties = {
    fontSize: '11px',
    color: THEME.textMuted,
    fontFamily: 'monospace',
    flexShrink: 0,
  };

  const groupHeadingStyle: React.CSSProperties = {
    padding: '6px 12px 2px',
    fontSize: '11px',
    fontWeight: 600,
    color: THEME.groupHeading,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    userSelect: 'none',
  };

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: THEME.backdrop,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}
    >
      {/* Dialog — stop propagation so clicks inside don't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '560px',
          maxHeight: '400px',
          backgroundColor: THEME.bg,
          border: `1px solid ${THEME.border}`,
          borderRadius: '8px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CommandRoot
          label="Command Palette"
          style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          shouldFilter={true}
        >
          {/* Search input */}
          <div
            style={{
              borderBottom: `1px solid ${THEME.border}`,
              padding: '8px 12px',
              backgroundColor: THEME.inputBg,
            }}
          >
            <CommandInput
              ref={inputRef}
              value={search}
              onValueChange={setSearch}
              placeholder="Search commands..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: THEME.text,
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <CommandList
            style={{
              overflowY: 'auto',
              flex: 1,
              padding: '4px',
            }}
          >
            <CommandEmpty
              style={{
                padding: '24px',
                textAlign: 'center',
                color: THEME.textMuted,
                fontSize: '13px',
              }}
            >
              No commands found.
            </CommandEmpty>

            {/* Recent — only show when search is empty */}
            {!search && recentCommands.length > 0 && (
              <CommandGroup
                heading={<span style={groupHeadingStyle}>Recent</span>}
              >
                {recentCommands.map((cmd) => (
                  <CommandItem
                    key={cmd.id}
                    value={`recent-${cmd.id}-${cmd.label}`}
                    onSelect={() => onExecute(cmd)}
                    style={itemStyle}
                    data-selected-style={`background: ${THEME.bgHover}`}
                  >
                    <span>{cmd.label}</span>
                    {cmd.keybind && <span style={keybindStyle}>{cmd.keybind}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Sessions */}
            {sessionCommands.length > 0 && (
              <CommandGroup heading={<span style={groupHeadingStyle}>Sessions</span>}>
                {sessionCommands.map((cmd) => (
                  <CommandItem
                    key={cmd.id}
                    value={`${cmd.id}-${cmd.label}`}
                    keywords={[cmd.label]}
                    onSelect={() => handleSessionSwitch(cmd)}
                    style={itemStyle}
                  >
                    <span>{cmd.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Layout commands */}
            {layoutCommands.length > 0 && (
              <CommandGroup heading={<span style={groupHeadingStyle}>Layout</span>}>
                {layoutCommands.map((cmd) => (
                  <CommandItem
                    key={cmd.id}
                    value={`${cmd.id}-${cmd.label}`}
                    keywords={cmd.keywords}
                    onSelect={() => onExecute(cmd)}
                    style={itemStyle}
                  >
                    <span>{cmd.label}</span>
                    {cmd.keybind && <span style={keybindStyle}>{cmd.keybind}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Settings commands */}
            {settingsCommands.length > 0 && (
              <CommandGroup heading={<span style={groupHeadingStyle}>Settings</span>}>
                {settingsCommands.map((cmd) => (
                  <CommandItem
                    key={cmd.id}
                    value={`${cmd.id}-${cmd.label}`}
                    keywords={cmd.keywords}
                    onSelect={() => onExecute(cmd)}
                    style={itemStyle}
                  >
                    <span>{cmd.label}</span>
                    {cmd.keybind && <span style={keybindStyle}>{cmd.keybind}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </CommandRoot>
      </div>
    </div>
  );
}

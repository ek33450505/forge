import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import * as Slider from '@radix-ui/react-slider';
import * as Select from '@radix-ui/react-select';
import { useThemeStore } from '../store/theme';
import { THEME_REGISTRY, type ThemeName } from '../themes/index';
import { getAllCommands } from '../lib/commands';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  initialTab?: 'appearance' | 'terminal' | 'shortcuts';
}

const FONT_FAMILIES = [
  { value: 'Menlo, Monaco, "Courier New", monospace', label: 'Menlo' },
  { value: 'Monaco, monospace', label: 'Monaco' },
  { value: '"Courier New", monospace', label: 'Courier New' },
  { value: '"Fira Code", monospace', label: 'Fira Code' },
  { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono' },
  { value: '"Source Code Pro", monospace', label: 'Source Code Pro' },
];

export function SettingsPanel({ open, onClose, initialTab = 'appearance' }: SettingsPanelProps) {
  const themeName = useThemeStore((s) => s.themeName);
  const fontFamily = useThemeStore((s) => s.fontFamily);
  const fontSize = useThemeStore((s) => s.fontSize);
  const setTheme = useThemeStore((s) => s.setTheme);
  const setFontFamily = useThemeStore((s) => s.setFontFamily);
  const setFontSize = useThemeStore((s) => s.setFontSize);

  const allCommands = getAllCommands();

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            backgroundColor: 'var(--modal-overlay)',
          }}
        />
        <Dialog.Content
          aria-label="Settings"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            width: '580px',
            maxHeight: '520px',
            backgroundColor: 'var(--modal-bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            color: 'var(--fg)',
            fontFamily: 'inherit',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            <Dialog.Title style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
              Settings
            </Dialog.Title>
            <Dialog.Close
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--status-bar-text)',
                cursor: 'pointer',
                fontSize: '18px',
                lineHeight: 1,
                padding: '2px 6px',
              }}
            >
              ×
            </Dialog.Close>
          </div>

          <Tabs.Root
            defaultValue={initialTab}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
          >
            {/* Tab list */}
            <Tabs.List
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
                padding: '0 12px',
              }}
            >
              {(['appearance', 'terminal', 'shortcuts'] as const).map((tab) => (
                <Tabs.Trigger
                  key={tab}
                  value={tab}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: '2px solid transparent',
                    color: 'var(--status-bar-text)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: '8px 12px',
                    textTransform: 'capitalize',
                    transition: 'color 120ms, border-color 120ms',
                  }}
                  data-tab={tab}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'var(--fg)'; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.color = ''; }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            {/* Appearance tab */}
            <Tabs.Content
              value="appearance"
              style={{ flex: 1, overflowY: 'auto', padding: '16px' }}
            >
              <p style={{ fontSize: '12px', color: 'var(--status-bar-text)', marginBottom: '12px' }}>
                Active theme: <strong style={{ color: 'var(--accent)' }}>{THEME_REGISTRY[themeName].displayName}</strong>
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                }}
              >
                {(Object.entries(THEME_REGISTRY) as [ThemeName, typeof THEME_REGISTRY[ThemeName]][]).map(([name, theme]) => (
                  <div
                    key={name}
                    onClick={() => setTheme(name)}
                    onMouseEnter={() => setTheme(name)}
                    style={{
                      border: `2px solid ${themeName === name ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: '6px',
                      padding: '10px',
                      cursor: 'pointer',
                      backgroundColor: theme.background,
                      transition: 'border-color 120ms',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: theme.foreground, marginBottom: '8px' }}>
                      {theme.displayName}
                    </div>
                    {/* Color swatch row */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[theme.background, theme.accent, theme.terminal.background, theme.terminal.foreground, theme.terminal.red, theme.terminal.green].map((color, i) => (
                        <div
                          key={i}
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '3px',
                            backgroundColor: color,
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Tabs.Content>

            {/* Terminal tab */}
            <Tabs.Content
              value="terminal"
              style={{ flex: 1, overflowY: 'auto', padding: '16px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Font family */}
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--status-bar-text)', display: 'block', marginBottom: '8px' }}>
                    Font Family
                  </label>
                  <Select.Root value={fontFamily} onValueChange={setFontFamily}>
                    <Select.Trigger
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: 'var(--input-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        color: 'var(--input-text)',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      <Select.Value />
                      <Select.Icon style={{ color: 'var(--status-bar-text)' }}>▾</Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content
                        style={{
                          backgroundColor: 'var(--modal-bg)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          zIndex: 10000,
                        }}
                      >
                        <Select.Viewport>
                          {FONT_FAMILIES.map((f) => (
                            <Select.Item
                              key={f.value}
                              value={f.value}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: 'var(--fg)',
                                fontFamily: f.value,
                              }}
                            >
                              <Select.ItemText>{f.label}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>

                {/* Font size */}
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--status-bar-text)', display: 'block', marginBottom: '8px' }}>
                    Font Size: <strong style={{ color: 'var(--fg)' }}>{fontSize}px</strong>
                  </label>
                  <Slider.Root
                    min={10}
                    max={24}
                    step={1}
                    value={[fontSize]}
                    onValueChange={([v]) => setFontSize(v)}
                    style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '100%', height: '20px' }}
                  >
                    <Slider.Track
                      style={{
                        backgroundColor: 'var(--border)',
                        height: '4px',
                        flex: 1,
                        borderRadius: '2px',
                        position: 'relative',
                      }}
                    >
                      <Slider.Range
                        style={{
                          position: 'absolute',
                          backgroundColor: 'var(--accent)',
                          height: '100%',
                          borderRadius: '2px',
                        }}
                      />
                    </Slider.Track>
                    <Slider.Thumb
                      style={{
                        display: 'block',
                        width: '16px',
                        height: '16px',
                        backgroundColor: 'var(--accent)',
                        border: '2px solid var(--modal-bg)',
                        borderRadius: '50%',
                        cursor: 'pointer',
                      }}
                    />
                  </Slider.Root>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--status-bar-text)', marginTop: '4px' }}>
                    <span>10px</span>
                    <span>24px</span>
                  </div>
                </div>
              </div>
            </Tabs.Content>

            {/* Shortcuts tab */}
            <Tabs.Content
              value="shortcuts"
              style={{ flex: 1, overflowY: 'auto', padding: '16px' }}
            >
              <p style={{ fontSize: '12px', color: 'var(--status-bar-text)', marginBottom: '12px' }}>
                Shortcut customization coming in Phase 8.
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--status-bar-text)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Command</th>
                    <th style={{ textAlign: 'right', padding: '4px 8px', color: 'var(--status-bar-text)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Shortcut</th>
                  </tr>
                </thead>
                <tbody>
                  {allCommands.map((cmd) => (
                    <tr key={cmd.id}>
                      <td style={{ padding: '6px 8px', color: 'var(--fg)', borderBottom: '1px solid var(--border)' }}>{cmd.label}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--accent)', fontFamily: 'monospace', borderBottom: '1px solid var(--border)' }}>
                        {cmd.keybind ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Tabs.Content>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

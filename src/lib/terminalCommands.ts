import type { Terminal } from '@xterm/xterm';
import { useThemeStore } from '../store/theme';
import { THEME_REGISTRY, type ThemeName } from '../themes/index';
import { useCommandHistoryStore } from '../store/commandHistory';

interface TerminalCommand {
  name: string;
  description: string;
  handler: (terminal: Terminal, args: string[]) => void;
}

const commands = new Map<string, TerminalCommand>();

function register(cmd: TerminalCommand) {
  commands.set(cmd.name, cmd);
}

export function getTerminalCommand(name: string): TerminalCommand | undefined {
  return commands.get(name);
}

export function getAllTerminalCommands(): TerminalCommand[] {
  return Array.from(commands.values());
}

// Built-in commands

register({
  name: 'clear',
  description: 'Clear terminal scrollback',
  handler: (terminal) => {
    terminal.clear();
  },
});

register({
  name: 'reset',
  description: 'Full terminal reset',
  handler: (terminal) => {
    terminal.reset();
  },
});

register({
  name: 'theme',
  description: 'Switch theme (usage: /theme <name>)',
  handler: (terminal, args) => {
    const available = Object.keys(THEME_REGISTRY);
    if (!args[0]) {
      terminal.writeln('Usage: /theme <name>');
      terminal.writeln(`Available: ${available.join(', ')}`);
      return;
    }
    if (!(args[0] in THEME_REGISTRY)) {
      terminal.writeln(`Unknown theme: ${args[0]}`);
      terminal.writeln(`Available: ${available.join(', ')}`);
      return;
    }
    useThemeStore.getState().setTheme(args[0] as ThemeName);
    terminal.writeln(`Theme set to: ${args[0]}`);
  },
});

register({
  name: 'history',
  description: 'Show recent command history',
  handler: (terminal) => {
    const history = useCommandHistoryStore.getState().shellHistory;
    if (history.length === 0) {
      terminal.writeln('No command history.');
      return;
    }
    terminal.writeln('Recent commands:');
    history.slice(0, 20).forEach((cmd, i) => {
      terminal.writeln(`  ${i + 1}. ${cmd}`);
    });
  },
});

register({
  name: 'help',
  description: 'Show available slash commands',
  handler: (terminal) => {
    terminal.writeln('Available commands:');
    for (const cmd of commands.values()) {
      terminal.writeln(`  /${cmd.name.padEnd(12)} ${cmd.description}`);
    }
  },
});

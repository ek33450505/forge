export interface Command {
  id: string;
  label: string;
  group: 'Layout' | 'Session' | 'Settings';
  keywords?: string[];
  keybind?: string; // display string e.g. "⌘D"
  handler: () => void;
}

// Module-level registry — NOT Zustand (handlers are functions)
const registry = new Map<string, Command>();

export function registerCommand(cmd: Command): void {
  if (registry.has(cmd.id)) {
    throw new Error(`Duplicate command id: ${cmd.id}`);
  }
  registry.set(cmd.id, cmd);
}

export function overwriteCommand(cmd: Command): void {
  registry.set(cmd.id, cmd);
}

export function getCommand(id: string): Command | undefined {
  return registry.get(id);
}

export function getAllCommands(): Command[] {
  return Array.from(registry.values());
}

export function clearRegistry(): void {
  registry.clear();
}

import type { AIDetector } from './types';

const PATTERNS = [
  /Cost:\s+\$[\d.]+/,
  /^\w+\([^)]*\)\.\.\./m,
  /Esc to interrupt/i,
  /\/clear to save \d+ tokens/,
];

const SHELL_PATTERNS = [
  /\$\s*$/m,
  /❯\s*$/m,
];

export const claudeCodeDetector: AIDetector = {
  tool: 'claude-code',
  matchesOutput: (data) => PATTERNS.some((p) => p.test(data)),
  matchesShell: (data) => SHELL_PATTERNS.some((p) => p.test(data)),
};

export interface ErrorPattern {
  pattern: RegExp;
  label: string;
  suggestion: string;
}

export const errorPatterns: ErrorPattern[] = [
  {
    pattern: /[Pp]ermission denied/,
    label: 'Permission denied',
    suggestion: 'File permission error. Try: `sudo <cmd>` or `chmod +x <file>`',
  },
  {
    pattern: /command not found/,
    label: 'Command not found',
    suggestion: 'Command not installed. Try: `which <cmd>` or check PATH',
  },
  {
    pattern: /ENOENT|No such file or directory/,
    label: 'File or directory missing',
    suggestion: 'The referenced path does not exist. Check for typos or create the missing path',
  },
  {
    pattern: /npm ERR!|yarn error/,
    label: 'Package manager error',
    suggestion: 'Package manager error. Try: `npm install` or clear `node_modules`',
  },
  {
    pattern: /Error: Cannot find module/,
    label: 'Missing Node.js module',
    suggestion: 'Missing Node.js module. Run `npm install`',
  },
  {
    pattern: /SyntaxError:/,
    label: 'Syntax error',
    suggestion: 'Syntax error in script. Check the referenced file and line number',
  },
  {
    pattern: /cargo error\[|error\[E\d+\]/,
    label: 'Rust compile error',
    suggestion: 'Rust compile error — check line numbers above',
  },
  {
    pattern: /exit status [1-9]|exited with code [1-9]/,
    label: 'Non-zero exit code',
    suggestion: 'Command exited with a non-zero status. Check output above for details',
  },
  {
    pattern: /fatal: not a git repository/,
    label: 'Not a git repository',
    suggestion: 'Not a git repo. Run `git init` or `cd` to the correct directory',
  },
  {
    pattern: /SIGKILL|Killed/,
    label: 'Process killed',
    suggestion: 'Process killed (OOM or manual). Check memory usage',
  },
];

/** Strip ANSI escape codes from terminal output */
export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

/** Match terminal output against all error patterns. Returns first match or null. */
export function matchError(text: string): { label: string; suggestion: string } | null {
  const clean = stripAnsi(text);
  for (const ep of errorPatterns) {
    if (ep.pattern.test(clean)) {
      return { label: ep.label, suggestion: ep.suggestion };
    }
  }
  return null;
}

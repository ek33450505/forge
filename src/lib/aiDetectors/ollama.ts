import type { AIDetector } from './types';

// Ollama PTY (interactive mode) is plain text — detect by process name only.
// For API streaming, these JSON patterns confirm it:
const PATTERNS = [
  /^\{"model":"[^"]+","created_at":"[^"]+","response":/,
  /"done":true.*"eval_count":/,
  /^>>> /m, // ollama interactive prompt
];

export const ollamaDetector: AIDetector = {
  tool: 'ollama',
  matchesOutput: (data) => PATTERNS.some((p) => p.test(data)),
};

export async function isOllamaServerRunning(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:11434/api/version');
    const data = await res.json() as { version?: string };
    return typeof data.version === 'string';
  } catch {
    return false;
  }
}

import type { AIDetector } from './types';

// OpenAI Codex CLI (openai/codex) — released April 2025
// Process name: 'codex', requires OPENAI_API_KEY
const PATTERNS = [
  /^codex/im,              // startup header
  /^\w+\([^)]*\)\.\.\./m, // tool call format (same as Claude Code)
  /openai/i,              // model name references
];

export const codexDetector: AIDetector = {
  tool: 'codex',
  matchesOutput: (data) => PATTERNS.some((p) => p.test(data)),
};

import type { AIDetector } from './types';

const PATTERNS = [
  /^\{"type":"system_init"/m,
  /^\{"type":"content_delta"/m,
  /^\{"type":"result"/m,
  /Analyzing codebase\.\.\.$/m,
];

export const cursorCliDetector: AIDetector = {
  tool: 'cursor-cli',
  matchesOutput: (data) => PATTERNS.some((p) => p.test(data)),
};

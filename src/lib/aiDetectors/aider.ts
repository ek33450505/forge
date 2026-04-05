import type { AIDetector } from './types';

const PATTERNS = [
  /^Tokens:\s+[\d.]+k?\s+sent,\s+[\d.]+k?\s+received/m,
  /^Aider v[\d.]+/m,
  /Cost:\s+\$[\d.]+\s+message/,
];

export const aiderDetector: AIDetector = {
  tool: 'aider',
  matchesOutput: (data) => PATTERNS.some((p) => p.test(data)),
};

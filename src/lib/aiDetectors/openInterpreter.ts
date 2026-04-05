import type { AIDetector } from './types';

const PATTERNS = [
  /Would you like to run this code\?/,
  /^Open Interpreter/m,
  /^Model: .+ \| Context Window:/m,
];

export const openInterpreterDetector: AIDetector = {
  tool: 'open-interpreter',
  matchesOutput: (data) => PATTERNS.some((p) => p.test(data)),
};

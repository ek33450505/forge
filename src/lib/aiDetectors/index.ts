export type { AIDetector } from './types';
export { claudeCodeDetector } from './claudeCode';
export { aiderDetector } from './aider';
export { ollamaDetector } from './ollama';
export { codexDetector } from './codex';
export { openInterpreterDetector } from './openInterpreter';
export { cursorCliDetector } from './cursorCli';

import { claudeCodeDetector } from './claudeCode';
import { aiderDetector } from './aider';
import { ollamaDetector } from './ollama';
import { codexDetector } from './codex';
import { openInterpreterDetector } from './openInterpreter';
import { cursorCliDetector } from './cursorCli';
import type { AIDetector } from './types';

export const ALL_DETECTORS: AIDetector[] = [
  claudeCodeDetector,
  aiderDetector,
  ollamaDetector,
  codexDetector,
  openInterpreterDetector,
  cursorCliDetector,
];

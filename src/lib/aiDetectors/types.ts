import type { SessionType } from '../../types/sessions';

export interface AIDetector {
  tool: SessionType;
  matchesOutput(data: string): boolean;
  matchesShell?(data: string): boolean;
}

import { useMemo } from 'react';
import { useAgentOutputStore } from '../store/agentOutput';
import type { CostBlock, ThinkingBlock } from '../types/agentOutput';

// Default token pricing (Opus-class)
const INPUT_RATE = 3 / 1_000_000;   // $3/M input tokens
const OUTPUT_RATE = 15 / 1_000_000;  // $15/M output tokens

interface SessionMetrics {
  tokens: number;
  cost: number;
}

interface TokenMeterData {
  totalTokens: number;
  estimatedCost: number;
  perSession: Record<string, SessionMetrics>;
}

export function useTokenMeter(): TokenMeterData {
  const blocks = useAgentOutputStore((s) => s.blocks);

  return useMemo(() => {
    const perSession: Record<string, SessionMetrics> = {};
    let totalTokens = 0;
    let estimatedCost = 0;

    for (const [sessionId, sessionBlocks] of Object.entries(blocks)) {
      let sessionTokens = 0;
      let sessionCost = 0;

      for (const block of sessionBlocks) {
        if (block.type === 'cost') {
          const c = block.content as CostBlock;
          sessionTokens += c.inputTokens + c.outputTokens;
          if (c.totalCost !== undefined) {
            sessionCost += c.totalCost;
          } else {
            sessionCost += c.inputTokens * INPUT_RATE + c.outputTokens * OUTPUT_RATE;
          }
        } else if (block.type === 'thinking') {
          const t = block.content as ThinkingBlock;
          const estTokens = t.tokenCount ?? Math.round(t.fullText.length / 4);
          sessionTokens += estTokens;
          sessionCost += estTokens * OUTPUT_RATE;
        }
      }

      if (sessionTokens > 0) {
        perSession[sessionId] = { tokens: sessionTokens, cost: sessionCost };
        totalTokens += sessionTokens;
        estimatedCost += sessionCost;
      }
    }

    return { totalTokens, estimatedCost, perSession };
  }, [blocks]);
}

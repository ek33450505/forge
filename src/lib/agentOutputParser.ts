import type { OutputBlock, OutputBlockType, OutputBlockContent } from '../types/agentOutput';

// Strip ANSI escape sequences
function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').replace(/\x1b\][^\x07]*\x07/g, '');
}

type ParserState = 'IDLE' | 'IN_TOOL_CALL' | 'IN_THINKING' | 'IN_FILE_OP';

const TOOL_NAMES = ['Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep', 'Agent', 'WebSearch', 'WebFetch'];
const TOOL_PATTERN = new RegExp(`^\\s*(${TOOL_NAMES.join('|')})\\s*[:(]`, 'i');
const FILE_WRITE_PATTERN = /(?:Created|Wrote|Updated)\s+(?:file[:\s]+)?(\S+)/i;
const COST_PATTERN = /(?:Total\s+cost|tokens?)[\s:]+([0-9,.]+)/i;
const TOKEN_INPUT_PATTERN = /input[:\s]+([0-9,]+)/i;
const TOKEN_OUTPUT_PATTERN = /output[:\s]+([0-9,]+)/i;
const THINKING_START_PATTERN = /^\s*(?:thinking|<thinking>)/i;
const THINKING_END_PATTERN = /^\s*(?:<\/thinking>|---)/;

export class AgentOutputParser {
  private sessionId: string;
  private state: ParserState = 'IDLE';
  private buffer: string[] = [];
  private currentToolName = '';
  private blockCount = 0;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  private makeBlock(type: OutputBlockType, content: OutputBlockContent, collapsed = false): OutputBlock {
    this.blockCount++;
    return {
      id: `${this.sessionId}-${this.blockCount}-${Date.now()}`,
      type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      collapsed,
      content,
    };
  }

  parse(chunk: string): OutputBlock[] {
    const clean = stripAnsi(chunk);
    const lines = clean.split('\n');
    const blocks: OutputBlock[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      switch (this.state) {
        case 'IDLE': {
          // Check for tool call
          const toolMatch = trimmed.match(TOOL_PATTERN);
          if (toolMatch) {
            this.state = 'IN_TOOL_CALL';
            this.currentToolName = toolMatch[1];
            this.buffer = [trimmed];
            break;
          }

          // Check for thinking block
          if (THINKING_START_PATTERN.test(trimmed)) {
            this.state = 'IN_THINKING';
            this.buffer = [];
            break;
          }

          // Check for file operation
          const fileMatch = trimmed.match(FILE_WRITE_PATTERN);
          if (fileMatch) {
            blocks.push(this.makeBlock(
              'file_write',
              {
                operation: trimmed.toLowerCase().includes('edit') ? 'edit' : 'write',
                filePath: fileMatch[1],
                preview: trimmed,
                fullContent: trimmed,
              } satisfies import('../types/agentOutput').FileBlock,
            ));
            break;
          }

          // Check for cost/token line
          if (COST_PATTERN.test(trimmed)) {
            const inputMatch = trimmed.match(TOKEN_INPUT_PATTERN);
            const outputMatch = trimmed.match(TOKEN_OUTPUT_PATTERN);
            const costMatch = trimmed.match(/\$([0-9.]+)/);
            blocks.push(this.makeBlock(
              'cost',
              {
                inputTokens: inputMatch ? parseInt(inputMatch[1].replace(/,/g, ''), 10) : 0,
                outputTokens: outputMatch ? parseInt(outputMatch[1].replace(/,/g, ''), 10) : 0,
                totalCost: costMatch ? parseFloat(costMatch[1]) : undefined,
              } satisfies import('../types/agentOutput').CostBlock,
            ));
            break;
          }

          // Default: accumulate as text (skip very short lines)
          if (trimmed.length > 5) {
            blocks.push(this.makeBlock(
              'text',
              { text: trimmed } satisfies import('../types/agentOutput').TextBlock,
            ));
          }
          break;
        }

        case 'IN_TOOL_CALL': {
          // End of tool call: blank line or new tool
          if (trimmed === '' || TOOL_PATTERN.test(trimmed)) {
            blocks.push(this.makeBlock(
              'tool_call',
              {
                toolName: this.currentToolName,
                params: this.buffer.join('\n'),
              } satisfies import('../types/agentOutput').ToolCallBlock,
            ));
            this.state = 'IDLE';
            this.buffer = [];
            // Re-process this line if it's a new tool
            if (TOOL_PATTERN.test(trimmed)) {
              const m = trimmed.match(TOOL_PATTERN);
              if (m) {
                this.state = 'IN_TOOL_CALL';
                this.currentToolName = m[1];
                this.buffer = [trimmed];
              }
            }
          } else {
            this.buffer.push(trimmed);
            // Cap buffer at 50 lines to prevent unbounded growth
            if (this.buffer.length > 50) {
              blocks.push(this.makeBlock(
                'tool_call',
                {
                  toolName: this.currentToolName,
                  params: this.buffer.join('\n'),
                } satisfies import('../types/agentOutput').ToolCallBlock,
              ));
              this.state = 'IDLE';
              this.buffer = [];
            }
          }
          break;
        }

        case 'IN_THINKING': {
          if (THINKING_END_PATTERN.test(trimmed)) {
            const fullText = this.buffer.join('\n');
            blocks.push(this.makeBlock(
              'thinking',
              {
                tokenCount: Math.round(fullText.length / 4),
                preview: fullText.slice(0, 100),
                fullText,
              } satisfies import('../types/agentOutput').ThinkingBlock,
              true, // collapsed by default
            ));
            this.state = 'IDLE';
            this.buffer = [];
          } else {
            this.buffer.push(trimmed);
            // Cap buffer
            if (this.buffer.length > 200) {
              const fullText = this.buffer.join('\n');
              blocks.push(this.makeBlock(
                'thinking',
                {
                  tokenCount: Math.round(fullText.length / 4),
                  preview: fullText.slice(0, 100),
                  fullText,
                } satisfies import('../types/agentOutput').ThinkingBlock,
                true,
              ));
              this.state = 'IDLE';
              this.buffer = [];
            }
          }
          break;
        }

        case 'IN_FILE_OP': {
          // Shouldn't reach here with current logic
          this.state = 'IDLE';
          break;
        }
      }
    }

    return blocks;
  }

  reset(): void {
    this.state = 'IDLE';
    this.buffer = [];
    this.currentToolName = '';
  }
}

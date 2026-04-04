import type { OutputBlock, ToolCallBlock, ThinkingBlock, FileBlock, CostBlock, TextBlock } from '../types/agentOutput';
import { useAgentOutputStore } from '../store/agentOutput';

const TYPE_ICONS: Record<string, string> = {
  tool_call: '\uD83D\uDD27',   // wrench
  thinking: '\uD83D\uDCAD',    // thought bubble
  file_write: '\uD83D\uDCC4',  // page facing up
  file_edit: '\uD83D\uDCC4',
  cost: '\uD83D\uDCB0',        // money bag
  text: '\uD83D\uDCDD',        // memo
  tool_result: '\uD83D\uDD27',
};

const TYPE_BORDER_COLORS: Record<string, string> = {
  tool_call: 'var(--warning)',
  thinking: 'var(--claude-accent)',
  file_write: 'var(--success)',
  file_edit: 'var(--success)',
  cost: 'var(--warning)',
  text: 'var(--text-subtle)',
  tool_result: 'var(--warning)',
};

function getTitle(block: OutputBlock): string {
  switch (block.type) {
    case 'tool_call':
      return (block.content as ToolCallBlock).toolName;
    case 'thinking': {
      const tc = (block.content as ThinkingBlock).tokenCount;
      return tc ? `Thinking (est. ${tc} tokens)` : 'Thinking';
    }
    case 'file_write':
    case 'file_edit':
      return (block.content as FileBlock).filePath;
    case 'cost': {
      const c = block.content as CostBlock;
      return c.totalCost ? `Cost: $${c.totalCost.toFixed(2)}` : `Tokens: ${c.inputTokens + c.outputTokens}`;
    }
    case 'text':
      return (block.content as TextBlock).text.slice(0, 50);
    default:
      return block.type;
  }
}

function getExpandedContent(block: OutputBlock): string {
  switch (block.type) {
    case 'tool_call':
      return (block.content as ToolCallBlock).params;
    case 'thinking':
      return (block.content as ThinkingBlock).fullText;
    case 'file_write':
    case 'file_edit':
      return (block.content as FileBlock).fullContent;
    case 'cost': {
      const c = block.content as CostBlock;
      return `Input: ${c.inputTokens}\nOutput: ${c.outputTokens}${c.totalCost ? `\nCost: $${c.totalCost.toFixed(4)}` : ''}`;
    }
    case 'text':
      return (block.content as TextBlock).text;
    default:
      return '';
  }
}

interface OutputCardProps {
  block: OutputBlock;
}

export function OutputCard({ block }: OutputCardProps) {
  const toggleBlock = useAgentOutputStore((s) => s.toggleBlock);
  const icon = TYPE_ICONS[block.type] ?? '\uD83D\uDCDD';
  const borderColor = TYPE_BORDER_COLORS[block.type] ?? 'var(--text-subtle)';
  const title = getTitle(block);
  const time = new Date(block.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div
      style={{
        borderLeft: `3px solid ${borderColor}`,
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '4px',
        margin: '4px 8px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        onClick={() => { toggleBlock(block.id); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          cursor: 'pointer',
          fontSize: '11px',
          color: 'var(--fg)',
          userSelect: 'none',
          borderLeft: `3px solid ${borderColor}`,
        }}
      >
        <span>{icon}</span>
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 500,
          }}
        >
          {title}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text-subtle)', flexShrink: 0 }}>
          {time}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text-subtle)', flexShrink: 0 }}>
          {block.collapsed ? '\u25B6' : '\u25BC'}
        </span>
      </div>

      {/* Expanded content */}
      {!block.collapsed && (
        <div
          style={{
            padding: '6px 8px',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: 'var(--text-muted)',
            maxHeight: '300px',
            overflowY: 'auto',
            borderTop: '1px solid var(--card-border)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {getExpandedContent(block)}
        </div>
      )}
    </div>
  );
}

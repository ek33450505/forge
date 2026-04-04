export type OutputBlockType = 'tool_call' | 'tool_result' | 'thinking' | 'file_write' | 'file_edit' | 'text' | 'cost';

export interface ToolCallBlock {
  toolName: string;
  params: string;
  result?: string;
  duration?: number;
}

export interface ThinkingBlock {
  tokenCount?: number;
  preview: string;
  fullText: string;
}

export interface FileBlock {
  operation: 'write' | 'edit';
  filePath: string;
  preview: string;
  fullContent: string;
}

export interface TextBlock {
  text: string;
}

export interface CostBlock {
  inputTokens: number;
  outputTokens: number;
  totalCost?: number;
}

export type OutputBlockContent = ToolCallBlock | ThinkingBlock | FileBlock | TextBlock | CostBlock;

export interface OutputBlock {
  id: string;
  type: OutputBlockType;
  timestamp: number;
  sessionId: string;
  collapsed: boolean;
  content: OutputBlockContent;
}

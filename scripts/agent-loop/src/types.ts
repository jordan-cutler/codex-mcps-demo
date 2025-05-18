/**
 * Represents a tool that can be called by the LLM
 */
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

/**
 * Configuration for the AgentLoop
 */
export interface AgentLoopConfig {
  initialPrompt: string;
  tools: Tool[];
  llmProvider: {
    apiKey: string;
    model: string;
    // Other provider-specific options
    maxTokens?: number;
    temperature?: number;
  };
  logging?: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * Message in the conversation history
 */
export interface Message {
  role: 'user' | 'system' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

/**
 * Represents a tool call extracted from LLM response
 */
export interface ToolCall {
  id?: string;
  name: string;
  params: Record<string, any>;
}

/**
 * Result of a tool execution
 */
export interface ToolResult {
  toolCall: ToolCall;
  result: any;
  error?: Error;
}

/**
 * Final response from the agent loop
 */
export interface AgentLoopResponse {
  finalAnswer: string;
  history: Message[];
  logs?: LogEntry[];
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  component: string;
  message: string;
  data?: any;
}

/**
 * Internal types for streaming responses
 */
export interface StreamingChunk {
  text: string;
  toolCalls: ToolCall[];
  isComplete: boolean;
}

/**
 * Error types
 */
export class ToolExecutionError extends Error {
  constructor(
    message: string,
    public toolCall: ToolCall,
    public cause?: Error,
  ) {
    super(message);
    this.name = 'ToolExecutionError';
  }
}

export class LLMProviderError extends Error {
  constructor(
    message: string,
    public cause?: Error,
  ) {
    super(message);
    this.name = 'LLMProviderError';
  }
}

export class AgentLoopError extends Error {
  constructor(
    message: string,
    public cause?: Error,
  ) {
    super(message);
    this.name = 'AgentLoopError';
  }
}

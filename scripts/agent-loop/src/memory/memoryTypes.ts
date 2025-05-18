import { Message, ToolCall, ToolResult } from '../types';

/**
 * Configuration options for memory management
 */
export interface MemoryManagerConfig {
  apiKey: string;
  userId?: string;
  maxTokens?: number;
  summarizeThreshold?: number;
  persistenceEnabled?: boolean;
  memoryStrategy?: 'basic' | 'sliding' | 'summarize' | 'vector';
}

/**
 * Options for memory operations
 */
export interface MemoryOperationOptions {
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Memory search options
 */
export interface MemorySearchOptions extends MemoryOperationOptions {
  limit?: number;
  minScore?: number;
}

/**
 * Result from a memory search
 */
export interface MemorySearchResult {
  messages: Message[];
  score?: number;
}

/**
 * Result from a memory operation
 */
export interface MemoryOperationResult {
  success: boolean;
  message?: string;
  data?: any;
}

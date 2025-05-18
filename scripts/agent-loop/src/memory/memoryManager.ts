import MemoryClient from 'mem0ai';
import { Message, ToolCall, ToolResult } from '../types';
import { Logger } from '../logger';
import { SlidingWindowStrategy } from './strategies/slidingWindow';
import { TokenCounter } from './utils/tokenCounter';
import {
  MemoryManagerConfig,
  MemoryOperationOptions,
  MemorySearchOptions,
  MemorySearchResult,
  MemoryOperationResult,
} from './memoryTypes';

/**
 * Manages memory for the agent loop
 * Handles storage, retrieval, and windowing of messages
 */
export class MemoryManager {
  private mem0Client: any; // MemoryClient from mem0ai
  private localMessages: Message[] = [];
  private slidingWindow: SlidingWindowStrategy;
  private logger: Logger;
  private config: MemoryManagerConfig;
  private defaultUserId: string;

  /**
   * Create a new memory manager
   *
   * @param config Configuration for the memory manager
   * @param logger Logger instance
   */
  constructor(config: MemoryManagerConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;

    // Initialize mem0 client if API key is provided
    if (config.apiKey) {
      try {
        this.mem0Client = new MemoryClient({ apiKey: config.apiKey });
        this.logger.info('MemoryManager', 'Initialized mem0ai client');
      } catch (error) {
        this.logger.error(
          'MemoryManager',
          'Failed to initialize mem0ai client',
          { error },
        );
        // Fall back to local memory only
        this.mem0Client = null;
      }
    } else {
      this.logger.warn(
        'MemoryManager',
        'No mem0ai API key provided, using local memory only',
      );
      this.mem0Client = null;
    }

    // Initialize sliding window strategy
    this.slidingWindow = new SlidingWindowStrategy(config.maxTokens || 4000);

    // Set default user ID
    this.defaultUserId = config.userId || 'default_user';

    this.logger.info('MemoryManager', 'Initialized', {
      usesMem0: !!this.mem0Client,
      maxTokens: config.maxTokens || 4000,
    });
  }

  /**
   * Add a user message to memory
   *
   * @param content Message content
   * @param options Operation options
   * @returns Operation result
   */
  async addUserMessage(
    content: string,
    options?: MemoryOperationOptions,
  ): Promise<MemoryOperationResult> {
    const message: Message = {
      role: 'user',
      content,
    };

    // Add to local memory
    this.localMessages.push(message);

    // Add to mem0 if available
    if (this.mem0Client) {
      try {
        const userId = options?.userId || this.defaultUserId;
        await this.mem0Client.add([message], {
          user_id: userId,
          metadata: options?.metadata,
        });

        this.logger.debug('MemoryManager', 'Added user message to mem0', {
          userId,
        });
      } catch (error) {
        this.logger.error(
          'MemoryManager',
          'Failed to add user message to mem0',
          { error },
        );
        // Continue with local memory even if mem0 fails
      }
    }

    return { success: true };
  }

  /**
   * Add an assistant message to memory
   *
   * @param content Message content
   * @param toolCalls Tool calls in the message
   * @param options Operation options
   * @returns Operation result
   */
  async addAssistantMessage(
    content: string,
    toolCalls?: ToolCall[],
    options?: MemoryOperationOptions,
  ): Promise<MemoryOperationResult> {
    const message: Message = {
      role: 'assistant',
      content,
      toolCalls,
    };

    // Add to local memory
    this.localMessages.push(message);

    // Add to mem0 if available
    if (this.mem0Client) {
      try {
        const userId = options?.userId || this.defaultUserId;
        await this.mem0Client.add([message], {
          user_id: userId,
          metadata: options?.metadata,
        });

        this.logger.debug('MemoryManager', 'Added assistant message to mem0', {
          userId,
          hasToolCalls: !!toolCalls && toolCalls.length > 0,
        });
      } catch (error) {
        this.logger.error(
          'MemoryManager',
          'Failed to add assistant message to mem0',
          { error },
        );
      }
    }

    return { success: true };
  }

  /**
   * Add tool results to memory
   *
   * @param toolResults Tool execution results
   * @param options Operation options
   * @returns Operation result
   */
  async addToolResults(
    toolResults: ToolResult[],
    options?: MemoryOperationOptions,
  ): Promise<MemoryOperationResult> {
    const message: Message = {
      role: 'system',
      content: 'Tool execution results',
      toolResults,
    };

    // Add to local memory
    this.localMessages.push(message);

    // Add to mem0 if available
    if (this.mem0Client) {
      try {
        const userId = options?.userId || this.defaultUserId;
        await this.mem0Client.add([message], {
          user_id: userId,
          metadata: options?.metadata,
        });

        this.logger.debug('MemoryManager', 'Added tool results to mem0', {
          userId,
          toolCount: toolResults.length,
        });
      } catch (error) {
        this.logger.error(
          'MemoryManager',
          'Failed to add tool results to mem0',
          { error },
        );
      }
    }

    return { success: true };
  }

  /**
   * Get messages for the current prompt
   * Applies sliding window to stay within token limits
   *
   * @returns Messages for prompt
   */
  getMessagesForPrompt(): Message[] {
    // Apply sliding window to local messages
    return this.slidingWindow.apply(this.localMessages);
  }

  /**
   * Search memory for relevant messages
   *
   * @param query Search query
   * @param options Search options
   * @returns Search results
   */
  async searchMemory(
    query: string,
    options?: MemorySearchOptions,
  ): Promise<MemorySearchResult> {
    // If mem0 is available, use it for search
    if (this.mem0Client) {
      try {
        const userId = options?.userId || this.defaultUserId;
        const results = await this.mem0Client.search(query, {
          user_id: userId,
          limit: options?.limit || 10,
          min_score: options?.minScore || 0.7,
          metadata: options?.metadata,
        });

        this.logger.debug('MemoryManager', 'Searched mem0', {
          userId,
          resultsCount: results.length,
        });

        return {
          messages: results,
          score: results.length > 0 ? 1.0 : 0,
        };
      } catch (error) {
        this.logger.error('MemoryManager', 'Failed to search mem0', { error });
        // Fall back to local search if mem0 fails
      }
    }

    // Simple local "search" - just return recent messages
    // In a real implementation, we would do semantic search here
    const recentMessages = this.localMessages.slice(-10);

    return {
      messages: recentMessages,
      score: 0.5, // Dummy score
    };
  }

  /**
   * Clear all messages from memory
   *
   * @param options Operation options
   * @returns Operation result
   */
  async clearMemory(
    options?: MemoryOperationOptions,
  ): Promise<MemoryOperationResult> {
    // Clear local memory
    this.localMessages = [];

    // We can't easily clear mem0 memory, so just log a warning
    if (this.mem0Client) {
      this.logger.warn(
        'MemoryManager',
        'Local memory cleared, but mem0 memory persists',
      );
    }

    return { success: true };
  }

  /**
   * Get current token count for all messages
   *
   * @returns Token count
   */
  getCurrentTokenCount(): number {
    return TokenCounter.estimateMessagesTokens(this.localMessages);
  }

  /**
   * Export memory data for persistence
   *
   * @returns Exported memory data
   */
  exportMemory(): any {
    return {
      messages: this.localMessages,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Import memory data
   *
   * @param data Exported memory data
   */
  importMemory(data: any): void {
    if (data && Array.isArray(data.messages)) {
      this.localMessages = data.messages;
      this.logger.info('MemoryManager', 'Imported memory data', {
        messageCount: data.messages.length,
      });
    } else {
      this.logger.error(
        'MemoryManager',
        'Failed to import memory data, invalid format',
      );
    }
  }
}

import pRetry from 'p-retry';
import { Tool, ToolCall, ToolResult, ToolExecutionError } from './types';
import { Logger } from './logger';

/**
 * Manages tool execution and error handling
 */
export class ToolManager {
  private tools: Map<string, Tool>;
  private logger: Logger;

  /**
   * Creates a new ToolManager
   *
   * @param tools Array of available tools
   * @param logger Logger instance
   */
  constructor(tools: Tool[], logger: Logger) {
    this.tools = new Map();
    this.logger = logger;

    for (const tool of tools) {
      this.tools.set(tool.name, tool);
    }

    this.logger.info('ToolManager', `Initialized with ${tools.length} tools`);
  }

  /**
   * Execute a single tool call
   *
   * @param toolCall Tool call to execute
   * @param retries Number of retry attempts
   */
  async executeTool(toolCall: ToolCall, retries = 3): Promise<ToolResult> {
    const tool = this.tools.get(toolCall.name);

    if (!tool) {
      this.logger.error('ToolManager', `Tool not found: ${toolCall.name}`);
      return {
        toolCall,
        result: null,
        error: new ToolExecutionError(
          `Tool not found: ${toolCall.name}`,
          toolCall,
        ),
      };
    }

    this.logger.debug('ToolManager', `Executing tool: ${toolCall.name}`, {
      params: toolCall.params,
    });

    try {
      // Execute with retry logic
      const result = await pRetry(
        async () => {
          try {
            const startTime = Date.now();
            const result = await tool.execute(toolCall.params);
            const duration = Date.now() - startTime;

            this.logger.debug(
              'ToolManager',
              `Tool executed successfully: ${toolCall.name}`,
              {
                duration,
                result,
              },
            );

            return result;
          } catch (error) {
            this.logger.warn(
              'ToolManager',
              `Error executing tool: ${toolCall.name}`,
              { error },
            );
            throw error; // Rethrow for retry
          }
        },
        {
          retries,
          onFailedAttempt: (error) => {
            this.logger.warn(
              'ToolManager',
              `Retry attempt failed for tool: ${toolCall.name}`,
              {
                attemptNumber: error.attemptNumber,
                retriesLeft: error.retriesLeft,
              },
            );
          },
        },
      );

      return {
        toolCall,
        result,
      };
    } catch (error) {
      this.logger.error(
        'ToolManager',
        `All retry attempts failed for tool: ${toolCall.name}`,
        { error },
      );
      return {
        toolCall,
        result: null,
        error: new ToolExecutionError(
          `Failed to execute tool ${toolCall.name}: ${(error as Error).message}`,
          toolCall,
          error as Error,
        ),
      };
    }
  }

  /**
   * Execute multiple tool calls, optionally in parallel
   *
   * @param toolCalls Tool calls to execute
   * @param parallel Whether to execute tools in parallel
   * @param retries Number of retry attempts
   */
  async executeTools(
    toolCalls: ToolCall[],
    parallel = true,
    retries = 3,
  ): Promise<ToolResult[]> {
    if (toolCalls.length === 0) {
      return [];
    }

    this.logger.info(
      'ToolManager',
      `Executing ${toolCalls.length} tools, parallel=${parallel}`,
    );

    if (parallel) {
      try {
        // Execute all tools in parallel
        const promises = toolCalls.map((toolCall) =>
          this.executeTool(toolCall, retries),
        );
        return await Promise.all(promises);
      } catch (error) {
        this.logger.error('ToolManager', 'Error in parallel tool execution', {
          error,
        });
        // We should never get here because executeTool already handles errors
        // But just in case, return partial results if available
        return toolCalls.map((toolCall) => ({
          toolCall,
          result: null,
          error: new ToolExecutionError(
            `Parallel execution failed: ${(error as Error).message}`,
            toolCall,
            error as Error,
          ),
        }));
      }
    } else {
      // Execute tools sequentially
      const results: ToolResult[] = [];

      for (const toolCall of toolCalls) {
        const result = await this.executeTool(toolCall, retries);
        results.push(result);
      }

      return results;
    }
  }

  /**
   * Get a list of all available tools
   */
  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }
}

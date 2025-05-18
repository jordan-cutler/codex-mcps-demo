import {
  AgentLoopConfig,
  AgentLoopResponse,
  AgentLoopError,
  Message,
  StreamingChunk,
  ToolCall,
} from './types';
import { Logger } from './logger';
import { PromptManager } from './promptManager';
import { ToolManager } from './toolManager';
import { LLMClient } from './llmClient';

/**
 * Main AgentLoop class - orchestrates prompt creation, LLM calls, and tool execution
 */
export class AgentLoop {
  private config: AgentLoopConfig;
  private logger: Logger;
  private promptManager: PromptManager;
  private toolManager: ToolManager;
  private llmClient: LLMClient;
  private history: Message[] = [];
  private isRunning: boolean = false;

  /**
   * Creates a new AgentLoop instance
   *
   * @param config Configuration options
   */
  constructor(config: AgentLoopConfig) {
    this.config = config;

    // Initialize logger
    this.logger = new Logger(
      config.logging?.enabled ?? true,
      config.logging?.level ?? 'info',
    );

    // Initialize components
    this.promptManager = new PromptManager(this.logger);
    this.toolManager = new ToolManager(config.tools, this.logger);
    this.llmClient = new LLMClient(
      config.llmProvider.apiKey,
      config.llmProvider.model,
      {
        maxTokens: config.llmProvider.maxTokens,
        temperature: config.llmProvider.temperature,
      },
      this.logger,
    );

    this.logger.info('AgentLoop', 'Initialized', {
      model: config.llmProvider.model,
      toolCount: config.tools.length,
    });
  }

  /**
   * Execute the agent loop until completion
   *
   * @param additionalMessages Optional additional messages to include
   */
  async run(additionalMessages: string[] = []): Promise<AgentLoopResponse> {
    if (this.isRunning) {
      throw new AgentLoopError('Agent loop is already running');
    }

    this.isRunning = true;
    let finalAnswer = '';

    try {
      this.logger.info('AgentLoop', 'Starting agent loop');

      // Handle additional messages if provided
      if (additionalMessages.length > 0) {
        for (const message of additionalMessages) {
          this.history.push({
            role: 'user',
            content: message,
          });
        }
      }

      // Start with initial prompt if history is empty
      if (this.history.length === 0) {
        this.history.push({
          role: 'user',
          content: this.config.initialPrompt,
        });
      }

      let turnsWithoutToolCalls = 0;
      const MAX_TURNS_WITHOUT_TOOLS = 3; // To prevent infinite loops

      // Main loop
      while (true) {
        // Prepare messages for LLM with current history
        const promptMessages = this.promptManager.createPrompt(
          this.config.initialPrompt,
          this.history,
          this.toolManager.getTools(),
        );

        this.logger.debug(
          'AgentLoop',
          `Sending prompt with ${promptMessages.length} messages`,
        );

        // Collect tool calls from the streaming response
        const allToolCalls: ToolCall[] = [];

        // Call LLM with streaming response
        const fullContent = await this.llmClient.streamCompletion(
          promptMessages,
          this.toolManager.getTools(),
          (chunk: StreamingChunk) => {
            // Process each chunk as it arrives
            if (chunk.toolCalls.length > 0) {
              // Add any new tool calls to our collection
              for (const toolCall of chunk.toolCalls) {
                if (!allToolCalls.some((tc) => tc.id === toolCall.id)) {
                  allToolCalls.push(toolCall);
                }
              }
            }

            // If this is the final chunk, check if we're done
            if (chunk.isComplete) {
              this.logger.debug('AgentLoop', 'LLM response complete', {
                contentLength: chunk.text.length,
                toolCallCount: allToolCalls.length,
              });
            }
          },
        );

        // Save assistant response to history
        const assistantMessage = this.promptManager.formatToolCallsForHistory(
          fullContent,
          allToolCalls,
        );
        this.history.push(assistantMessage);

        // Check if we need to execute tools
        if (allToolCalls.length > 0) {
          turnsWithoutToolCalls = 0;

          this.logger.info(
            'AgentLoop',
            `Executing ${allToolCalls.length} tool calls`,
          );

          // Execute all tool calls in parallel
          const toolResults = await this.toolManager.executeTools(
            allToolCalls,
            true, // parallel execution
          );

          // Add tool results to history
          const resultsMessage =
            this.promptManager.formatToolResultsForHistory(toolResults);
          this.history.push(resultsMessage);
        } else {
          turnsWithoutToolCalls++;

          // If no tool calls and appears to be a final answer, we're done
          if (turnsWithoutToolCalls >= MAX_TURNS_WITHOUT_TOOLS) {
            this.logger.info(
              'AgentLoop',
              `Reached ${MAX_TURNS_WITHOUT_TOOLS} turns without tool calls, completing loop`,
            );
            finalAnswer = fullContent;
            break;
          }

          // Check if content looks like a final answer
          if (this.isLikelyFinalAnswer(fullContent)) {
            this.logger.info('AgentLoop', 'Detected final answer');
            finalAnswer = fullContent;
            break;
          }
        }
      }

      this.logger.info('AgentLoop', 'Agent loop completed successfully');

      return {
        finalAnswer,
        history: [...this.history],
        logs: this.logger.getLogs(),
      };
    } catch (error) {
      this.logger.error('AgentLoop', 'Error in agent loop execution', {
        error,
      });
      throw new AgentLoopError(
        `Error in agent loop: ${(error as Error).message}`,
        error as Error,
      );
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Checks if the response looks like a final answer
   *
   * @param content Response content
   */
  private isLikelyFinalAnswer(content: string): boolean {
    // Simple heuristic to determine if this is a final answer
    // A more sophisticated approach could be implemented

    const finalAnswerIndicators = [
      'in conclusion',
      'to summarize',
      'final answer',
      'the answer is',
    ];

    const contentLower = content.toLowerCase();

    // Check if content contains any final answer indicators
    return (
      finalAnswerIndicators.some((indicator) =>
        contentLower.includes(indicator),
      ) ||
      // Or if it's long enough and doesn't appear to be asking for more information
      (content.length > 100 && !contentLower.includes('?'))
    );
  }

  /**
   * Reset the agent loop state
   */
  reset(): void {
    this.history = [];
    this.logger.clearLogs();
    this.logger.info('AgentLoop', 'State reset');
  }
}

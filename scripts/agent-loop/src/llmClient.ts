import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import {
  LLMProviderError,
  Message,
  ToolCall,
  StreamingChunk,
  Tool,
} from './types';
import { Logger } from './logger';

interface PendingToolCall {
  id: string;
  name: string;
  arguments: string;
}

/**
 * Client for interfacing with OpenAI's language models
 */
export class LLMClient {
  private client: OpenAI;
  private model: string;
  private maxTokens?: number;
  private temperature?: number;
  private logger: Logger;

  /**
   * Creates a new LLMClient
   *
   * @param apiKey OpenAI API key
   * @param model Model to use (e.g., gpt-4)
   * @param options Additional options
   * @param logger Logger instance
   */
  constructor(
    apiKey: string,
    model: string,
    options: { maxTokens?: number; temperature?: number } = {},
    logger: Logger,
  ) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
    this.maxTokens = options.maxTokens;
    this.temperature = options.temperature;
    this.logger = logger;

    this.logger.info('LLMClient', `Initialized with model: ${model}`);
  }

  /**
   * Sends a request to the LLM and streams the response
   *
   * @param messages Conversation history
   * @param tools Available tools
   * @param onChunk Callback for streaming chunks
   */
  async streamCompletion(
    messages: Message[],
    tools: Tool[],
    onChunk: (chunk: StreamingChunk) => void,
  ): Promise<string> {
    try {
      this.logger.debug('LLMClient', 'Starting stream completion', {
        messages: messages.length,
        tools: tools.length,
      });

      // Format messages for OpenAI API
      const formattedMessages: ChatCompletionMessageParam[] = messages.map(
        (message) => {
          const base = {
            role: message.role as 'system' | 'user' | 'assistant',
            content: message.content,
          };

          // Add tool calls if present
          if (message.toolCalls && message.toolCalls.length > 0) {
            return {
              ...base,
              tool_calls: message.toolCalls.map((tc) => ({
                id: tc.id || `tc_${Date.now()}`,
                type: 'function' as const,
                function: {
                  name: tc.name,
                  arguments: JSON.stringify(tc.params),
                },
              })),
            };
          }

          // Add tool results if present
          if (message.toolResults && message.toolResults.length > 0) {
            return {
              ...base,
              tool_calls_supported: true, // Required for tool results
              tool_results: message.toolResults.map((tr) => ({
                tool_call_id: tr.toolCall.id || `tc_${Date.now()}`,
                type: 'function' as const,
                function: {
                  output: JSON.stringify(tr.result),
                },
              })),
            };
          }

          return base;
        },
      );

      // Format tools for OpenAI API
      const formattedTools = tools.map((tool) => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));

      // OpenAI streaming request
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: formattedMessages,
        tools: formattedTools,
        tool_choice: 'auto',
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: true,
      });

      let fullContent = '';
      const pendingToolCalls: Record<string, PendingToolCall> = {};
      const completedToolCalls: ToolCall[] = [];

      // Process the stream
      for await (const chunk of stream) {
        let chunkText = '';
        const delta = chunk.choices[0]?.delta;

        this.logger.debug('LLMClient', 'Received chunk from OpenAI', {
          delta: JSON.stringify(delta),
          raw: JSON.stringify(chunk),
        });

        // Extract text content
        if (delta?.content) {
          chunkText = delta.content;
          fullContent += chunkText;
          this.logger.debug('LLMClient', 'Text content in chunk', {
            text: chunkText,
          });
        }

        // Extract tool calls
        if (delta?.tool_calls && delta.tool_calls.length > 0) {
          this.logger.debug('LLMClient', 'Tool calls in chunk', {
            toolCalls: JSON.stringify(delta.tool_calls),
          });
          for (const toolCall of delta.tool_calls) {
            const id = toolCall.id || '';

            // Initialize or update the pending tool call
            if (!pendingToolCalls[id]) {
              pendingToolCalls[id] = {
                id,
                name: toolCall.function?.name || '',
                arguments: toolCall.function?.arguments || '',
              };

              this.logger.debug('LLMClient', 'Created new pending tool call', {
                id,
                name: toolCall.function?.name,
                argumentsLength: toolCall.function?.arguments ? toolCall.function.arguments.length : 0,
              });
            } else {
              if (toolCall.function?.name) {
                pendingToolCalls[id].name = toolCall.function.name;
              }
              if (toolCall.function?.arguments) {
                pendingToolCalls[id].arguments += toolCall.function.arguments;
                this.logger.debug('LLMClient', 'Updated pending tool call arguments', {
                  id,
                  name: pendingToolCalls[id].name,
                  argumentsLength: pendingToolCalls[id].arguments.length,
                  argumentsPart: toolCall.function.arguments,
                });
              }
            }

            // Check if the tool call is complete
            const pendingCall = pendingToolCalls[id];
            const isValidJson = this.isValidJson(pendingCall.arguments);
            this.logger.debug('LLMClient', 'Checking if tool call is complete', {
              id,
              name: pendingCall.name,
              hasName: !!pendingCall.name,
              hasArguments: !!pendingCall.arguments,
              argumentsLength: pendingCall.arguments.length,
              isValidJson,
              arguments: pendingCall.arguments,
            });

            if (
              pendingCall.name &&
              pendingCall.arguments &&
              isValidJson
            ) {
              try {
                const parsedArgs = JSON.parse(pendingCall.arguments);
                completedToolCalls.push({
                  id,
                  name: pendingCall.name,
                  params: parsedArgs,
                });

                // Remove from pending
                delete pendingToolCalls[id];

                this.logger.debug(
                  'LLMClient',
                  `Completed tool call: ${pendingCall.name}`,
                  {
                    id,
                    params: parsedArgs,
                  },
                );
              } catch (error) {
                // Arguments JSON might not be complete yet
                this.logger.debug(
                  'LLMClient',
                  'Tool call arguments not yet complete',
                  {
                    args: pendingCall.arguments,
                    error: (error as Error).message,
                  },
                );
              }
            }
          }
        }

        // After processing all chunks, check any remaining pending tool calls
        if (chunk.choices[0]?.finish_reason === 'tool_calls') {
          this.logger.debug('LLMClient', 'Finish reason is tool_calls, checking any pending tool calls', {
            pendingToolCalls: JSON.stringify(pendingToolCalls),
          });

          // Try to complete any pending tool calls
          for (const [id, pendingCall] of Object.entries(pendingToolCalls)) {
            try {
              if (pendingCall.name && pendingCall.arguments) {
                // Try to fix JSON if needed
                let args = pendingCall.arguments;
                if (!this.isValidJson(args)) {
                  // Simple attempt to fix common JSON issues
                  this.logger.debug('LLMClient', 'Attempting to fix invalid JSON', {
                    before: args,
                  });
                  args = args.replace(/\n/g, ' ').trim();
                  if (!args.startsWith('{')) args = '{' + args;
                  if (!args.endsWith('}')) args = args + '}';
                  this.logger.debug('LLMClient', 'Fixed JSON', {
                    after: args,
                  });
                }

                const parsedArgs = JSON.parse(args);
                completedToolCalls.push({
                  id,
                  name: pendingCall.name,
                  params: parsedArgs,
                });

                this.logger.debug('LLMClient', `Completed pending tool call after finish: ${pendingCall.name}`, {
                  id,
                  params: parsedArgs,
                });
              }
            } catch (error) {
              this.logger.warn('LLMClient', `Could not complete pending tool call: ${pendingCall.name}`, {
                id,
                error: (error as Error).message,
                arguments: pendingCall.arguments,
              });
            }
          }

          // Clear all pending tool calls
          Object.keys(pendingToolCalls).forEach(id => delete pendingToolCalls[id]);
        }

        // Check for completion
        const isComplete = chunk.choices[0]?.finish_reason !== null;

        onChunk({
          text: chunkText,
          toolCalls: [...completedToolCalls],
          isComplete,
        });

        if (isComplete) {
          break;
        }
      }

      this.logger.info('LLMClient', 'Stream completed', {
        contentLength: fullContent.length,
        toolCalls: completedToolCalls.length,
      });

      return fullContent;
    } catch (error) {
      this.logger.error('LLMClient', 'Error in stream completion', { error });
      throw new LLMProviderError(
        `Error in LLM request: ${(error as Error).message}`,
        error as Error,
      );
    }
  }

  /**
   * Checks if a string is valid JSON
   */
  private isValidJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }
}

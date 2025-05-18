import { Message, Tool } from './types';
import { Logger } from './logger';

/**
 * Manages prompt composition and context
 */
export class PromptManager {
  private logger: Logger;
  private maxContextSize: number = 4000; // Approximate token limit, can be refined

  /**
   * Creates a new PromptManager
   *
   * @param logger Logger instance
   */
  constructor(logger: Logger) {
    this.logger = logger;
    this.logger.info('PromptManager', 'Initialized');
  }

  /**
   * Create a formatted set of messages for the LLM with history and tools
   *
   * @param initialPrompt Initial user prompt
   * @param history Conversation history
   * @param tools Available tools
   */
  createPrompt(
    initialPrompt: string,
    history: Message[],
    tools: Tool[],
  ): Message[] {
    this.logger.debug('PromptManager', 'Creating prompt', {
      initialPromptLength: initialPrompt.length,
      historySize: history.length,
      toolCount: tools.length,
    });

    const systemMessage = this.createSystemMessage(tools);
    let messages: Message[] = [systemMessage];

    // If there's no history yet, just add the initial prompt
    if (history.length === 0) {
      messages.push({
        role: 'user',
        content: initialPrompt,
      });
      return messages;
    }

    // Otherwise, use the history and ensure it fits within context limits
    const managedHistory = this.manageHistorySize(history);
    messages = [systemMessage, ...managedHistory];

    return messages;
  }

  /**
   * Create a system message with tool descriptions
   *
   * @param tools Available tools
   */
  private createSystemMessage(tools: Tool[]): Message {
    let content = `You are a helpful AI assistant that can use tools to accomplish tasks.\n\n`;

    if (tools.length > 0) {
      content += `You have access to the following tools:\n\n`;

      for (const tool of tools) {
        content += `Tool: ${tool.name}\n`;
        content += `Description: ${tool.description}\n`;
        content += `Parameters:\n`;

        for (const [paramName, paramDetails] of Object.entries(
          tool.parameters,
        )) {
          content += `  - ${paramName}: ${paramDetails.description || 'No description'} (${paramDetails.type || 'any'}${paramDetails.required ? ', required' : ''})\n`;
        }

        content += `\n`;
      }

      content += `When you need to use a tool, format your response like this:
<tool_call>
{
  "name": "toolName",
  "params": {
    "param1": "value1",
    "param2": "value2"
  }
}
</tool_call>

You can call multiple tools by using multiple tool_call blocks.
After using tools, summarize what you did and provide a final answer.`;
    }

    return {
      role: 'system',
      content,
    };
  }

  /**
   * Ensure history fits within context limits
   *
   * @param history Conversation history
   */
  private manageHistorySize(history: Message[]): Message[] {
    // Simple strategy: keep most recent messages up to context limit
    // A more sophisticated approach would use token counting

    let totalSize = 0;
    const managedHistory: Message[] = [];

    // Process in reverse order (newest first)
    for (let i = history.length - 1; i >= 0; i--) {
      const message = history[i];

      // Estimate size (this is naive, a real implementation would use tokenization)
      const messageSize =
        message.content.length +
        JSON.stringify(message.toolCalls || []).length +
        JSON.stringify(message.toolResults || []).length;

      if (
        totalSize + messageSize <= this.maxContextSize ||
        managedHistory.length === 0
      ) {
        // Always include at least the most recent message
        managedHistory.unshift(message);
        totalSize += messageSize;
      } else {
        break;
      }
    }

    const trimmedCount = history.length - managedHistory.length;
    if (trimmedCount > 0) {
      this.logger.info(
        'PromptManager',
        `Trimmed ${trimmedCount} oldest messages to fit context limits`,
      );
    }

    return managedHistory;
  }

  /**
   * Format tool calls and results for inclusion in the conversation
   *
   * @param content Original assistant content
   * @param toolCalls Tool calls extracted from the response
   */
  formatToolCallsForHistory(content: string, toolCalls: any[]): Message {
    // Remove tool call syntax if present in the content to avoid confusion
    let cleanContent = content
      .replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '')
      .trim();

    return {
      role: 'assistant',
      content: cleanContent,
      toolCalls,
    };
  }

  /**
   * Format tool results for inclusion in the conversation
   *
   * @param toolResults Results from tool execution
   */
  formatToolResultsForHistory(toolResults: any[]): Message {
    const formattedResults = toolResults
      .map((result) => {
        const toolName = result.toolCall.name;
        const resultData = result.error
          ? `Error: ${result.error.message}`
          : JSON.stringify(result.result, null, 2);

        return `Tool: ${toolName}\nResult: ${resultData}`;
      })
      .join('\n\n');

    return {
      role: 'system',
      content: formattedResults,
      toolResults,
    };
  }
}

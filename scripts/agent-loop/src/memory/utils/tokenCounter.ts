import { Message } from '../../types';

/**
 * Simple token counter for estimating token usage
 * Note: This is a rough estimation - for production use, consider using a more accurate tokenizer
 */
export class TokenCounter {
  // Average tokens per character (roughly 4 chars per token for English)
  private static readonly AVG_CHARS_PER_TOKEN = 4;

  /**
   * Estimate token count for a single message
   *
   * @param message Message to count tokens for
   * @returns Estimated token count
   */
  static estimateMessageTokens(message: Message): number {
    const contentLength = message.content ? message.content.length : 0;

    // Base tokens for message structure (~4 tokens)
    let total = 4;

    // Add content tokens
    total += Math.ceil(contentLength / this.AVG_CHARS_PER_TOKEN);

    // Add tokens for tool calls (if any)
    if (message.toolCalls && message.toolCalls.length > 0) {
      // ~3 tokens per tool call for structure
      total += message.toolCalls.length * 3;

      // Add tokens for tool call content
      for (const toolCall of message.toolCalls) {
        // Name + params (JSON stringified)
        const tcLength =
          toolCall.name.length + JSON.stringify(toolCall.params).length;

        total += Math.ceil(tcLength / this.AVG_CHARS_PER_TOKEN);
      }
    }

    // Add tokens for tool results (if any)
    if (message.toolResults && message.toolResults.length > 0) {
      // ~3 tokens per tool result for structure
      total += message.toolResults.length * 3;

      // Add tokens for tool result content
      for (const toolResult of message.toolResults) {
        // Result (JSON stringified)
        const trLength = JSON.stringify(toolResult.result).length;
        total += Math.ceil(trLength / this.AVG_CHARS_PER_TOKEN);
      }
    }

    return total;
  }

  /**
   * Estimate token count for an array of messages
   *
   * @param messages Messages to count tokens for
   * @returns Estimated token count
   */
  static estimateMessagesTokens(messages: Message[]): number {
    // Base tokens for the messages array (~3 tokens)
    let total = 3;

    // Add tokens for each message
    for (const message of messages) {
      total += this.estimateMessageTokens(message);
    }

    return total;
  }
}

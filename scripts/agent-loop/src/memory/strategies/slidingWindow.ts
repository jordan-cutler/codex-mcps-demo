import { Message } from '../../types';
import { TokenCounter } from '../utils/tokenCounter';

/**
 * Sliding window memory strategy
 * Keeps the most recent messages within the token limit
 */
export class SlidingWindowStrategy {
  private maxTokens: number;

  /**
   * Create a sliding window strategy
   *
   * @param maxTokens Maximum tokens to keep in memory
   */
  constructor(maxTokens: number = 4000) {
    this.maxTokens = maxTokens;
  }

  /**
   * Apply sliding window strategy to messages
   *
   * @param messages Messages to apply strategy to
   * @returns Filtered messages within token limit
   */
  apply(messages: Message[]): Message[] {
    if (messages.length === 0) {
      return [];
    }

    const totalTokens = TokenCounter.estimateMessagesTokens(messages);

    // If we're already under the limit, return all messages
    if (totalTokens <= this.maxTokens) {
      return [...messages];
    }

    // Keep the first system message(s) if present
    const systemMessages = messages.filter((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    // We need to trim down the messages to fit within the token limit
    // Always keep the most recent messages, and system messages
    const result: Message[] = [...systemMessages];
    let currentTokens = TokenCounter.estimateMessagesTokens(result);

    // Add messages from most recent to oldest until we hit the token limit
    for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
      const message = nonSystemMessages[i];
      const messageTokens = TokenCounter.estimateMessageTokens(message);

      // Check if adding this message would exceed the limit
      // Leave some buffer (~100 tokens) for safety
      if (currentTokens + messageTokens > this.maxTokens - 100) {
        break;
      }

      // Add the message to the result (at the beginning since we're going backward)
      result.unshift(message);
      currentTokens += messageTokens;
    }

    return result;
  }
}

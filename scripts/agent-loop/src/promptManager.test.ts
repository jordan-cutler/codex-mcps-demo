import { PromptManager } from './promptManager';
import { Logger } from './logger';
import { Message, Tool, ToolCall, ToolResult } from './types';

describe('PromptManager', () => {
  let logger: Logger;
  let promptManager: PromptManager;
  let tools: Tool[];

  beforeEach(() => {
    // Mock logger
    logger = new Logger(false);
    jest.spyOn(logger, 'info').mockImplementation();
    jest.spyOn(logger, 'debug').mockImplementation();
    jest.spyOn(logger, 'warn').mockImplementation();
    jest.spyOn(logger, 'error').mockImplementation();

    // Initialize prompt manager
    promptManager = new PromptManager(logger);

    // Sample tools for testing
    tools = [
      {
        name: 'calculator',
        description: 'Performs mathematical calculations',
        parameters: {
          expression: {
            type: 'string',
            description: 'The mathematical expression to calculate',
            required: true,
          },
        },
        execute: async (params: any) => eval(params.expression),
      },
    ];
  });

  it('should create a prompt with initial prompt and no history', () => {
    const initialPrompt = 'Hello, can you help me?';
    const messages = promptManager.createPrompt(initialPrompt, [], tools);

    // Should have system message and user message
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toBe(initialPrompt);

    // System message should include tool description
    expect(messages[0].content).toContain('calculator');
    expect(messages[0].content).toContain('expression');
  });

  it('should include history in the prompt', () => {
    const initialPrompt = 'Initial question';
    const history: Message[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ];

    const messages = promptManager.createPrompt(initialPrompt, history, tools);

    // Should have system message + history
    expect(messages).toHaveLength(3);
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toBe('Hello');
    expect(messages[2].role).toBe('assistant');
    expect(messages[2].content).toBe('Hi there');
  });

  it('should format tool calls for history', () => {
    const content =
      'I\'ll calculate that for you. <tool_call>{"name":"calculator","params":{"expression":"2+2"}}</tool_call>';
    const toolCalls: ToolCall[] = [
      {
        name: 'calculator',
        params: { expression: '2+2' },
      },
    ];

    const message = promptManager.formatToolCallsForHistory(content, toolCalls);

    // Should remove tool_call syntax from content
    expect(message.role).toBe('assistant');
    expect(message.content).toBe("I'll calculate that for you.");
    expect(message.toolCalls).toEqual(toolCalls);
  });

  it('should format tool results for history', () => {
    const toolCall: ToolCall = {
      name: 'calculator',
      params: { expression: '2+2' },
    };

    const toolResults: ToolResult[] = [
      {
        toolCall,
        result: 4,
      },
    ];

    const message = promptManager.formatToolResultsForHistory(toolResults);

    expect(message.role).toBe('system');
    expect(message.content).toContain('Tool: calculator');
    expect(message.content).toContain('Result: 4');
    expect(message.toolResults).toEqual(toolResults);
  });

  it('should format error results for history', () => {
    const toolCall: ToolCall = {
      name: 'calculator',
      params: { expression: 'invalid' },
    };

    const error = new Error('Invalid expression');
    const toolResults: ToolResult[] = [
      {
        toolCall,
        result: null,
        error,
      },
    ];

    const message = promptManager.formatToolResultsForHistory(toolResults);

    expect(message.content).toContain('Error: Invalid expression');
  });

  it('should manage history size when it exceeds context limits', () => {
    // Generate a large history
    const largeHistory: Message[] = [];
    for (let i = 0; i < 100; i++) {
      // Each message is approx 100 characters
      largeHistory.push({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `This is message number ${i} with some additional text to make it longer than the typical message.`,
      });
    }

    const messages = promptManager.createPrompt(
      'New prompt',
      largeHistory,
      tools,
    );

    // History should be truncated
    expect(messages.length).toBeLessThan(largeHistory.length + 1); // +1 for system message

    // Should include system message
    expect(messages[0].role).toBe('system');

    // Should include most recent messages
    const lastHistoryMessage = largeHistory[largeHistory.length - 1];
    const lastPromptMessage = messages[messages.length - 1];
    expect(lastPromptMessage.content).toBe(lastHistoryMessage.content);
  });
});

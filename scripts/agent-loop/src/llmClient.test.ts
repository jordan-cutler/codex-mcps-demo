import { LLMClient } from './llmClient';
import { Logger } from './logger';
import { Message, Tool, StreamingChunk } from './types';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn().mockImplementation(async ({ stream }) => {
              // Mock streaming response
              if (stream) {
                return {
                  [Symbol.asyncIterator]: async function* () {
                    // Text response chunks
                    yield {
                      choices: [
                        {
                          delta: { content: 'I will ' },
                          finish_reason: null,
                        },
                      ],
                    };
                    yield {
                      choices: [
                        {
                          delta: { content: 'help you' },
                          finish_reason: null,
                        },
                      ],
                    };

                    // Tool call chunks
                    yield {
                      choices: [
                        {
                          delta: {
                            tool_calls: [
                              {
                                id: 'call_123',
                                function: {
                                  name: 'calculator',
                                  arguments: '{"expression":',
                                },
                              },
                            ],
                          },
                          finish_reason: null,
                        },
                      ],
                    };
                    yield {
                      choices: [
                        {
                          delta: {
                            tool_calls: [
                              {
                                id: 'call_123',
                                function: {
                                  arguments: '"2+2"}',
                                },
                              },
                            ],
                          },
                          finish_reason: null,
                        },
                      ],
                    };

                    // Final chunk
                    yield {
                      choices: [
                        {
                          delta: {},
                          finish_reason: 'tool_calls',
                        },
                      ],
                    };
                  },
                };
              }

              // Non-streaming response
              return {
                choices: [
                  {
                    message: {
                      content: 'I will help you',
                      tool_calls: [
                        {
                          id: 'call_123',
                          function: {
                            name: 'calculator',
                            arguments: '{"expression":"2+2"}',
                          },
                        },
                      ],
                    },
                  },
                ],
              };
            }),
          },
        },
      };
    }),
  };
});

describe('LLMClient', () => {
  let logger: Logger;
  let llmClient: LLMClient;
  let messages: Message[];
  let tools: Tool[];

  beforeEach(() => {
    // Create a logger that doesn't output to console
    logger = new Logger(false);
    jest.spyOn(logger, 'info').mockImplementation();
    jest.spyOn(logger, 'debug').mockImplementation();
    jest.spyOn(logger, 'warn').mockImplementation();
    jest.spyOn(logger, 'error').mockImplementation();

    // Create LLM client with mock API key
    llmClient = new LLMClient('test_api_key', 'gpt-4', {}, logger);

    // Sample messages
    messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Help me calculate 2+2' },
    ];

    // Sample tools
    tools = [
      {
        name: 'calculator',
        description: 'Performs calculations',
        parameters: {
          expression: { type: 'string', required: true },
        },
        execute: async (params: any) => eval(params.expression),
      },
    ];
  });

  it('should process streaming responses correctly', async () => {
    const chunks: StreamingChunk[] = [];

    // Callback to collect chunks
    const onChunk = (chunk: StreamingChunk) => {
      chunks.push(chunk);
    };

    // Call streamCompletion
    const fullContent = await llmClient.streamCompletion(
      messages,
      tools,
      onChunk,
    );

    // Verify content
    expect(fullContent).toBe('I will help you');

    // Verify chunks
    expect(chunks.length).toBeGreaterThan(0);

    // Check first text chunk
    expect(chunks[0].text).toBe('I will ');
    expect(chunks[0].isComplete).toBe(false);

    // Check for tool calls
    const lastNonCompleteChunk = chunks[chunks.length - 2];
    expect(lastNonCompleteChunk.toolCalls).toHaveLength(1);
    expect(lastNonCompleteChunk.toolCalls[0].name).toBe('calculator');
    expect(lastNonCompleteChunk.toolCalls[0].params).toEqual({
      expression: '2+2',
    });

    // Check completion
    expect(chunks[chunks.length - 1].isComplete).toBe(true);
  });

  it('should handle errors from the LLM provider', async () => {
    // Mock the OpenAI create method to throw an error
    const openaiMock = require('openai');
    openaiMock.OpenAI.mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('API error')),
          },
        },
      };
    });

    // Create a new client with the mocked implementation
    const errorClient = new LLMClient('test_api_key', 'gpt-4', {}, logger);

    // Test error handling
    await expect(
      errorClient.streamCompletion(messages, tools, () => {}),
    ).rejects.toThrow('Error in LLM request: API error');
  });
});

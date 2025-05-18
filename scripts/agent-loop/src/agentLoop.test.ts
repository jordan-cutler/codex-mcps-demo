import { AgentLoop } from './agentLoop';
import { Logger } from './logger';
import { LLMClient } from './llmClient';
import { ToolManager } from './toolManager';
import { PromptManager } from './promptManager';
import { AgentLoopConfig, StreamingChunk } from './types';

// Mock the components
jest.mock('./logger');
jest.mock('./llmClient');
jest.mock('./toolManager');
jest.mock('./promptManager');

describe('AgentLoop', () => {
  // Setup test mocks
  let mockLogger: jest.Mocked<Logger>;
  let mockLLMClient: jest.Mocked<LLMClient>;
  let mockToolManager: jest.Mocked<ToolManager>;
  let mockPromptManager: jest.Mocked<PromptManager>;

  let config: AgentLoopConfig;
  let agentLoop: AgentLoop;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock logger
    mockLogger = new Logger() as jest.Mocked<Logger>;
    (Logger as jest.MockedClass<typeof Logger>).mockImplementation(
      () => mockLogger,
    );

    // Create mock LLMClient with streamCompletion method
    mockLLMClient = {
      streamCompletion: jest.fn(),
    } as unknown as jest.Mocked<LLMClient>;
    (LLMClient as jest.MockedClass<typeof LLMClient>).mockImplementation(
      () => mockLLMClient,
    );

    // Create mock ToolManager
    mockToolManager = {
      executeTools: jest.fn(),
      getTools: jest.fn().mockReturnValue([]),
    } as unknown as jest.Mocked<ToolManager>;
    (ToolManager as jest.MockedClass<typeof ToolManager>).mockImplementation(
      () => mockToolManager,
    );

    // Create mock PromptManager
    mockPromptManager = {
      createPrompt: jest.fn().mockReturnValue([]),
      formatToolCallsForHistory: jest.fn(),
      formatToolResultsForHistory: jest.fn(),
    } as unknown as jest.Mocked<PromptManager>;
    (
      PromptManager as jest.MockedClass<typeof PromptManager>
    ).mockImplementation(() => mockPromptManager);

    // Create sample config
    config = {
      initialPrompt: 'Test prompt',
      tools: [],
      llmProvider: {
        apiKey: 'test_key',
        model: 'gpt-4',
      },
    };

    // Create agent loop
    agentLoop = new AgentLoop(config);
  });

  it('should initialize correctly', () => {
    expect(Logger).toHaveBeenCalled();
    expect(PromptManager).toHaveBeenCalled();
    expect(ToolManager).toHaveBeenCalled();
    expect(LLMClient).toHaveBeenCalled();
  });

  it('should run a basic loop with no tool calls', async () => {
    // Mock LLM response with no tool calls
    mockLLMClient.streamCompletion.mockImplementation(
      (messages, tools, onChunk) => {
        // Call onChunk with final response
        onChunk({
          text: 'This is the final answer',
          toolCalls: [],
          isComplete: true,
        });
        return Promise.resolve('This is the final answer');
      },
    );

    // Mock formatToolCallsForHistory
    mockPromptManager.formatToolCallsForHistory.mockReturnValue({
      role: 'assistant',
      content: 'This is the final answer',
    });

    // Run the loop
    const result = await agentLoop.run();

    // Verify results
    expect(result.finalAnswer).toBe('This is the final answer');
    expect(result.history).toHaveLength(2); // Initial user message + assistant response

    // Verify component calls
    expect(mockLLMClient.streamCompletion).toHaveBeenCalledTimes(1);
    expect(mockToolManager.executeTools).not.toHaveBeenCalled();
  });

  it('should execute tools when present in LLM response', async () => {
    // Mock tool calls in LLM response
    const toolCalls = [{ name: 'testTool', params: { test: 'value' } }];

    // Mock LLM response with tool calls
    mockLLMClient.streamCompletion.mockImplementation(
      (messages, tools, onChunk) => {
        // Call onChunk with tool calls
        onChunk({
          text: 'I will help you with that',
          toolCalls: toolCalls,
          isComplete: true,
        });
        return Promise.resolve('I will help you with that');
      },
    );

    // Mock tool execution results
    const toolResults = [{ toolCall: toolCalls[0], result: 'success' }];
    mockToolManager.executeTools.mockResolvedValue(toolResults);

    // Mock formatToolCallsForHistory and formatToolResultsForHistory
    mockPromptManager.formatToolCallsForHistory.mockReturnValue({
      role: 'assistant',
      content: 'I will help you with that',
      toolCalls,
    });
    mockPromptManager.formatToolResultsForHistory.mockReturnValue({
      role: 'system',
      content: 'Tool results',
      toolResults,
    });

    // Run the loop again with a final answer after tool execution
    mockLLMClient.streamCompletion
      .mockImplementationOnce((messages, tools, onChunk) => {
        // First call with tool calls
        onChunk({
          text: 'I will help you with that',
          toolCalls: toolCalls,
          isComplete: true,
        });
        return Promise.resolve('I will help you with that');
      })
      .mockImplementationOnce((messages, tools, onChunk) => {
        // Second call with final answer
        onChunk({
          text: 'The final answer is 42',
          toolCalls: [],
          isComplete: true,
        });
        return Promise.resolve('The final answer is 42');
      });

    // Run the loop
    const result = await agentLoop.run();

    // Verify results
    expect(result.finalAnswer).toBe('The final answer is 42');

    // Verify component calls
    expect(mockLLMClient.streamCompletion).toHaveBeenCalledTimes(2);
    expect(mockToolManager.executeTools).toHaveBeenCalledTimes(1);
    expect(mockToolManager.executeTools).toHaveBeenCalledWith(toolCalls, true);
  });

  it('should add additional messages to history', async () => {
    mockLLMClient.streamCompletion.mockImplementation(
      (messages, tools, onChunk) => {
        onChunk({
          text: 'Final answer',
          toolCalls: [],
          isComplete: true,
        });
        return Promise.resolve('Final answer');
      },
    );

    mockPromptManager.formatToolCallsForHistory.mockReturnValue({
      role: 'assistant',
      content: 'Final answer',
    });

    // Run with additional messages
    const additionalMessages = ['Additional question'];
    await agentLoop.run(additionalMessages);

    // Should have included additional messages in history
    // Can verify by checking the usage of the prompt manager
    expect(mockPromptManager.createPrompt).toHaveBeenCalled();
  });

  it('should reset the agent state', async () => {
    // Mock clearLogs
    mockLogger.clearLogs = jest.fn();

    // Reset the agent
    agentLoop.reset();

    // Verify logger clearLogs was called
    expect(mockLogger.clearLogs).toHaveBeenCalled();
  });

  it('should throw when run is called while already running', async () => {
    // Make streamCompletion never resolve to simulate a long-running request
    mockLLMClient.streamCompletion.mockImplementation(() => {
      return new Promise(() => {}); // Never resolves
    });

    // Start a run but don't await it
    const runPromise = agentLoop.run();

    // Try to run again immediately
    await expect(agentLoop.run()).rejects.toThrow(
      'Agent loop is already running',
    );

    // Clean up by forcing the first run to complete
    // This is a bit hacky but necessary for test cleanup
    (agentLoop as any).isRunning = false;
  });
});

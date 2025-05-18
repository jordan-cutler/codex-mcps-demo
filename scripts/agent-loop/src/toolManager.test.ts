import { ToolManager } from './toolManager';
import { Logger } from './logger';
import { Tool, ToolCall } from './types';

describe('ToolManager', () => {
  let logger: Logger;
  let tools: Tool[];
  let toolManager: ToolManager;

  beforeEach(() => {
    // Mock the logger to prevent console output in tests
    logger = new Logger(false);
    jest.spyOn(logger, 'info').mockImplementation();
    jest.spyOn(logger, 'debug').mockImplementation();
    jest.spyOn(logger, 'warn').mockImplementation();
    jest.spyOn(logger, 'error').mockImplementation();

    // Create mock tools
    tools = [
      {
        name: 'add',
        description: 'Adds two numbers',
        parameters: {
          a: { type: 'number', required: true },
          b: { type: 'number', required: true },
        },
        execute: async (params: any) => params.a + params.b,
      },
      {
        name: 'multiply',
        description: 'Multiplies two numbers',
        parameters: {
          a: { type: 'number', required: true },
          b: { type: 'number', required: true },
        },
        execute: async (params: any) => params.a * params.b,
      },
      {
        name: 'failingTool',
        description: 'This tool always fails',
        parameters: {},
        execute: async () => {
          throw new Error('Tool execution failed');
        },
      },
    ];

    // Create the tool manager
    toolManager = new ToolManager(tools, logger);
  });

  it('should initialize with the provided tools', () => {
    expect(toolManager.getTools()).toHaveLength(3);
    expect(toolManager.getTool('add')).toBeDefined();
    expect(toolManager.getTool('multiply')).toBeDefined();
    expect(toolManager.getTool('nonexistent')).toBeUndefined();
  });

  it('should execute a tool successfully', async () => {
    const toolCall: ToolCall = {
      name: 'add',
      params: { a: 2, b: 3 },
    };

    const result = await toolManager.executeTool(toolCall);

    expect(result.toolCall).toEqual(toolCall);
    expect(result.result).toEqual(5);
    expect(result.error).toBeUndefined();
  });

  it('should handle non-existent tools', async () => {
    const toolCall: ToolCall = {
      name: 'nonexistent',
      params: {},
    };

    const result = await toolManager.executeTool(toolCall);

    expect(result.toolCall).toEqual(toolCall);
    expect(result.result).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error!.message).toContain('Tool not found');
  });

  it('should retry failed tool executions', async () => {
    const toolCall: ToolCall = {
      name: 'failingTool',
      params: {},
    };

    // Create a spy to count retries
    const originalExecute = tools[2].execute;
    const executeSpy = jest.fn().mockImplementation(originalExecute);
    tools[2].execute = executeSpy;

    const result = await toolManager.executeTool(toolCall, 2);

    // Should have tried 1 initial + 2 retries = 3 times
    expect(executeSpy).toHaveBeenCalledTimes(3);
    expect(result.error).toBeDefined();
    expect(result.result).toBeNull();
  });

  it('should execute multiple tools in parallel', async () => {
    const toolCalls: ToolCall[] = [
      { name: 'add', params: { a: 2, b: 3 } },
      { name: 'multiply', params: { a: 4, b: 5 } },
    ];

    // Add spies to measure parallel execution
    const addSpy = jest.spyOn(tools[0], 'execute');
    const multiplySpy = jest.spyOn(tools[1], 'execute');

    const results = await toolManager.executeTools(toolCalls, true);

    expect(results).toHaveLength(2);
    expect(results[0].result).toEqual(5); // 2 + 3
    expect(results[1].result).toEqual(20); // 4 * 5

    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(multiplySpy).toHaveBeenCalledTimes(1);
  });

  it('should execute multiple tools sequentially', async () => {
    const toolCalls: ToolCall[] = [
      { name: 'add', params: { a: 2, b: 3 } },
      { name: 'multiply', params: { a: 4, b: 5 } },
    ];

    const results = await toolManager.executeTools(toolCalls, false);

    expect(results).toHaveLength(2);
    expect(results[0].result).toEqual(5);
    expect(results[1].result).toEqual(20);
  });

  it('should handle mixed success and failure in parallel execution', async () => {
    const toolCalls: ToolCall[] = [
      { name: 'add', params: { a: 2, b: 3 } },
      { name: 'failingTool', params: {} },
    ];

    const results = await toolManager.executeTools(toolCalls, true, 1);

    expect(results).toHaveLength(2);
    expect(results[0].result).toEqual(5);
    expect(results[1].error).toBeDefined();
  });

  it('should return an empty array when no tools to execute', async () => {
    const results = await toolManager.executeTools([]);
    expect(results).toEqual([]);
  });
});

# Agent Loop - Technical Specification

## Overview

A reusable agent loop that manages context, tool use, and LLM calls for engineers. The agent loop requires only prompts and tools as input, and handles all the complexity of orchestrating the LLM and tools.

## Core Requirements

### Functional Requirements

1. **Synchronous Execution**: All tool calls execute synchronously.
2. **Multi-turn Conversations**: Maintain context across multiple prompt-tool-LLM cycles.
3. **Multiple Tools Per Turn**: Allow the LLM to select and use multiple tools in a single cycle.
4. **Streaming Responses**: Support streaming LLM outputs as they are generated.
5. **Built-in Error Handling**: Include mechanisms for retrying failed tool calls and handling LLM errors gracefully.
6. **Black-box Abstraction**: Operate as a fully encapsulated system without requiring hooks or callbacks.
7. **Logging and Tracing**: Provide detailed logs of internal decisions and actions for debugging.
8. **Single LLM Provider**: Initially support one LLM provider (extensible in future).
9. **Node.js Only**: Run exclusively in Node.js environments.
10. **Standard Memory Management**: Use typical IDE-style context management.
11. **Uninterrupted Execution**: No support required for user interruption or cancellation.
12. **Trust Tool Execution**: Execute all tool calls without requiring confirmation.
13. **Parallel Tool Execution**: Support concurrent execution of independent tool calls.
14. **Simple API**: Expose a simple, single-entry-point API.
15. **No Timeouts**: No built-in timeout mechanisms needed.

### Non-functional Requirements

1. **Reliability**: Robust error handling to prevent crashes.
2. **Maintainability**: Clean, well-documented code structure.
3. **Extensibility**: Design that allows for future enhancements (e.g., additional LLM providers).
4. **Performance**: Efficient handling of parallel tool execution and streaming.

## Architecture

### Core Components

1. **AgentLoop Class**: Main entry point and orchestrator

   - Manages the overall execution flow
   - Maintains conversation history
   - Dispatches to other components

2. **PromptManager**: Handles prompt composition

   - Formats prompts with history and tool definitions
   - Ensures adherence to context limits
   - Applies any necessary prompt engineering techniques

3. **ToolManager**: Manages tool execution

   - Parses tool calls from LLM output
   - Executes tools in parallel when possible
   - Handles errors in tool execution

4. **LLMClient**: Interfaces with the LLM provider

   - Sends requests to the LLM
   - Processes streaming responses
   - Handles LLM-specific errors

5. **Logger**: Records execution details
   - Logs prompts, responses, tool calls, and errors
   - Configurable verbosity levels

### Data Flow

1. User provides initial prompt and tools
2. AgentLoop initializes components and history
3. PromptManager creates initial LLM prompt with tools definition
4. LLMClient sends request to LLM and receives streaming response
5. ToolManager parses any tool calls in the response
6. Tools are executed in parallel when possible
7. Results are collected and added to conversation history
8. Process repeats until completion criteria met
9. Final response returned to user

## Implementation Plan

### Phase 1: Core Structure and Basic Flow

- Set up project structure and dependencies
- Implement AgentLoop class with basic execution flow
- Create simple implementations of the PromptManager and LLMClient
- Establish conversation history management

### Phase 2: Tool Execution Framework

- Implement ToolManager for parsing tool calls
- Create mechanism for sequential tool execution
- Add basic error handling for tool execution
- Connect tool execution to the main agent loop

### Phase 3: Advanced Features

- Implement parallel tool execution
- Add streaming response handling
- Enhance error recovery mechanisms
- Develop comprehensive logging system

### Phase 4: Testing and Refinement

- Create unit tests for each component
- Develop integration tests for the complete flow
- Benchmark performance with various tool configurations
- Refine API based on testing results

### Phase 5: Documentation and Examples

- Create API documentation
- Develop usage examples
- Write integration guides
- Prepare for release

## API Design

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => any;
}

interface AgentLoopConfig {
  initialPrompt: string;
  tools: Tool[];
  llmProvider: {
    apiKey: string;
    model: string;
    // Other provider-specific options
  };
  logging?: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

interface AgentLoopResponse {
  finalAnswer: string;
  history: Array<{
    role: 'user' | 'system' | 'assistant';
    content: string;
    toolCalls?: any[];
    toolResults?: any[];
  }>;
  logs?: any[];
}

class AgentLoop {
  constructor(config: AgentLoopConfig);

  async run(additionalMessages?: string[]): Promise<AgentLoopResponse>;
}
```

## Example Usage

```typescript
import { AgentLoop } from './agent-loop';

const tools = [
  {
    name: 'calculator',
    description: 'Performs mathematical calculations',
    parameters: {
      expression: {
        type: 'string',
        description: 'The mathematical expression to calculate',
      },
    },
    execute: (params) => eval(params.expression),
  },
  // More tools...
];

const loop = new AgentLoop({
  initialPrompt:
    'Help me solve this math problem step by step: what is the derivative of x^2?',
  tools,
  llmProvider: {
    apiKey: process.env.LLM_API_KEY,
    model: 'gpt-4',
  },
  logging: {
    enabled: true,
    level: 'info',
  },
});

const result = await loop.run();
console.log(result.finalAnswer);
```

## Testing Strategy

1. **Unit Testing**: Test individual components in isolation

   - PromptManager: Test prompt formatting and context management
   - ToolManager: Test tool parsing and execution logic
   - LLMClient: Test API interaction (with mocks)

2. **Integration Testing**: Test components working together

   - Verify correct flow from prompt to tool execution
   - Test error handling and recovery paths

3. **E2E Testing**: Test the complete system
   - Run with real LLM and tools
   - Verify multi-turn conversation handling

## Limitations and Future Enhancements

### Current Limitations

- Single LLM provider support
- Node.js environment only
- No support for user interruption
- Fixed memory management approach

### Future Enhancements

- Support for multiple LLM providers
- Browser compatibility
- Advanced memory management strategies
- User interruption capabilities
- Timeout mechanisms
- Configurable hooks/callbacks
- Tool verification and safety features

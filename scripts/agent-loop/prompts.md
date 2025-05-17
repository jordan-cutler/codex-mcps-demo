# Agent Loop Implementation Prompts

This document provides a series of prompts to guide the implementation of the agent loop system as described in the specification. Each prompt is designed to help implement a specific component or feature.

## Project Setup

```
Create the initial project structure for the agent loop system in TypeScript. Include the necessary files for the AgentLoop class, PromptManager, ToolManager, LLMClient, and Logger components. Set up a basic package.json with the required dependencies for TypeScript, testing frameworks, and any necessary LLM client libraries.
```

## Core Components

### AgentLoop Class

```
Implement the main AgentLoop class according to the specification. It should:
1. Accept a configuration object with initialPrompt, tools, llmProvider, and optional logging settings
2. Maintain conversation history
3. Coordinate between the PromptManager, ToolManager, LLMClient, and Logger components
4. Expose a simple run() method that executes the agent loop until completion
5. Handle the overall flow from initial prompt to final response
```

### PromptManager

```
Implement the PromptManager class that handles prompt composition. It should:
1. Format prompts with conversation history
2. Include tool definitions in a format the LLM can understand
3. Ensure prompts stay within context limits
4. Structure prompts to effectively guide the LLM's responses and tool usage
5. Support updating prompts with tool execution results
```

### ToolManager

```
Implement the ToolManager class that handles tool execution. It should:
1. Parse tool calls from LLM output using a reliable parsing strategy
2. Support execution of multiple tools in parallel when appropriate
3. Handle errors during tool execution with retries and fallbacks
4. Format tool results for inclusion in the conversation context
5. Provide a clean interface for the AgentLoop to execute tools
```

### LLMClient

```
Implement the LLMClient class that interfaces with the LLM provider. It should:
1. Send requests to the LLM with proper formatting
2. Process streaming responses as they arrive
3. Handle provider-specific error cases
4. Support the chosen LLM provider's API
5. Extract both text content and tool calls from responses
```

### Logger

```
Implement the Logger component that provides detailed insights into the agent loop execution. It should:
1. Log prompts, responses, tool calls, and results
2. Support different verbosity levels
3. Format logs in a readable and consistent way
4. Provide timing information for performance analysis
5. Be configurable via the AgentLoop configuration
```

## Advanced Features

### Streaming Response Handler

```
Implement the streaming response handling mechanism that processes LLM outputs as they are generated. It should:
1. Process partial responses in chunks
2. Identify and extract complete tool calls as soon as they are available
3. Allow for early execution of tools when possible
4. Buffer text content to construct the complete LLM response
5. Handle edge cases like interrupted responses
```

### Parallel Tool Execution

```
Implement the parallel tool execution functionality. It should:
1. Identify independent tool calls that can be executed in parallel
2. Manage Promise.all or similar patterns for concurrent execution
3. Collect and organize results from parallel executions
4. Handle errors in individual parallel executions without failing the entire batch
5. Provide proper logging for parallel execution activities
```

### Error Recovery System

```
Implement the error recovery mechanisms for the agent loop. It should:
1. Detect and classify errors from tool executions and LLM calls
2. Implement retry logic with appropriate backoff strategies
3. Provide fallbacks for common error scenarios
4. Ensure the loop can continue despite non-critical failures
5. Log detailed error information for debugging
```

### Memory Management

```
Implement the conversation history and context management system. It should:
1. Maintain an efficient representation of the conversation history
2. Implement windowing or other strategies to keep within context limits
3. Prioritize relevant information when context limits are approached
4. Support persistence of conversation state if needed
5. Ensure all necessary context is available for each LLM call
```

## Integration and Testing

### Component Integration

```
Implement the integration of all components into a cohesive system. Ensure:
1. Clean interfaces between components with clear responsibilities
2. Proper error propagation between components
3. Efficient data flow through the system
4. Consistent logging across component boundaries
5. Adherence to the defined architecture
```

### Testing Framework

```
Implement a comprehensive testing framework for the agent loop. Include:
1. Unit tests for each component with appropriate mocks
2. Integration tests for component interactions
3. End-to-end tests with real or mock LLM providers
4. Performance benchmarks for key operations
5. Test coverage for error scenarios and edge cases
```

## Example Implementation

### Basic Example

```
Implement a complete example of the agent loop usage as described in the specification. Create:
1. A set of example tools including the calculator example
2. A sample prompt that demonstrates multi-turn reasoning
3. Proper configuration of the agent loop
4. Example of consuming and displaying results
5. Documentation for how to run and modify the example
```

### Advanced Example

```
Implement an advanced example that showcases the full capabilities of the agent loop. Include:
1. Multiple complex tools that benefit from parallel execution
2. A multi-turn conversation scenario
3. Error handling demonstrations
4. Logging output analysis
5. Performance optimizations in action
```

## Documentation

### API Documentation

```
Create comprehensive API documentation for the agent loop system. Include:
1. Detailed interface definitions with examples
2. Configuration options with explanations
3. Tool definition guidelines
4. Best practices for prompt design
5. Error handling strategies
```

### Integration Guide

```
Create an integration guide for engineers using the agent loop in their applications. Cover:
1. Step-by-step instructions for integration
2. Common patterns and anti-patterns
3. Performance considerations
4. Security best practices
5. Troubleshooting and debugging tips
```

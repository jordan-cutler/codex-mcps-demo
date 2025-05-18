# Agent Loop

A reusable agent loop that manages context, tool use, and LLM calls. The agent loop requires only prompts and tools as input, and handles all the complexity of orchestrating the LLM and tools.

## Features

- **Synchronous Execution**: All tool calls execute synchronously.
- **Multi-turn Conversations**: Maintains context across multiple prompt-tool-LLM cycles.
- **Multiple Tools Per Turn**: Allows the LLM to select and use multiple tools in a single cycle.
- **Streaming Responses**: Supports streaming LLM outputs as they are generated.
- **Built-in Error Handling**: Includes mechanisms for retrying failed tool calls and handling LLM errors gracefully.
- **Black-box Abstraction**: Operates as a fully encapsulated system.
- **Logging and Tracing**: Provides detailed logs of internal decisions and actions for debugging.
- **Parallel Tool Execution**: Supports concurrent execution of independent tool calls.
- **Simple API**: Exposes a simple, single-entry-point API.

## Installation

```bash
npm install agent-loop
```

## Quick Start

```typescript
import { AgentLoop } from 'agent-loop';

// Define your tools
const calculatorTool = {
  name: 'calculator',
  description: 'Performs mathematical calculations',
  parameters: {
    expression: {
      type: 'string',
      description: 'The mathematical expression to calculate',
      required: true,
    },
  },
  execute: async (params) => {
    // Safe implementation of calculation
    // DON'T use eval in production
    return evaluateExpression(params.expression);
  },
};

// Create the agent loop
const loop = new AgentLoop({
  initialPrompt:
    'Help me solve this math problem: what is the derivative of x^2?',
  tools: [calculatorTool],
  llmProvider: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
  },
  logging: {
    enabled: true,
    level: 'info',
  },
});

// Run the loop
const result = await loop.run();
console.log(result.finalAnswer);
```

## API Reference

### `AgentLoop`

The main class that orchestrates the agent loop.

#### Constructor

```typescript
constructor(config: AgentLoopConfig)
```

- `config`: Configuration options for the agent loop

#### Methods

- `run(additionalMessages?: string[]): Promise<AgentLoopResponse>`
  Executes the agent loop until completion.

- `reset(): void`
  Resets the agent loop state.

### Types

#### `AgentLoopConfig`

```typescript
interface AgentLoopConfig {
  initialPrompt: string;
  tools: Tool[];
  llmProvider: {
    apiKey: string;
    model: string;
    maxTokens?: number;
    temperature?: number;
  };
  logging?: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}
```

#### `Tool`

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}
```

#### `AgentLoopResponse`

```typescript
interface AgentLoopResponse {
  finalAnswer: string;
  history: Message[];
  logs?: LogEntry[];
}
```

## Examples

### Running the Basic Example

The project includes a simple example demonstrating the agent loop with calculator, weather, and date tools.

To run the example:

1. Create a `.env` file in the root directory with your OpenAI API key:

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

2. Build the project:

   ```bash
   npm run build
   ```

3. Run the example:
   ```bash
   npm start
   ```

This will execute the `examples/basic-example.ts` file, which demonstrates:

- Using multiple tools in the same conversation
- Parallel tool execution
- Handling multi-turn conversations
- Basic logging and result formatting

You can also run the simplified example directly:

```bash
npx ts-node agentLoop.ts
```

This example focuses only on the calculator functionality with a simpler prompt.

Check out the `examples` directory for more examples:

- `basic-example.ts`: A comprehensive example using calculator, weather, and date tools
- `complex-example.ts`: A multi-step mathematical puzzle that demonstrates 5-15 iterations of the agent loop
- (Additional examples will be added in future versions)

### Running the Complex Example

The complex example demonstrates the agent loop working through a multi-step mathematical puzzle that requires several iterations to solve. This example showcases:

1. Multi-turn reasoning with 5-15 iterations
2. Memory persistence between turns using a notepad tool
3. Multiple specialized tools working together
4. Step-by-step problem-solving approach

To run the complex example:

```bash
npm run start:complex
```

The example uses specialized tools for mathematical operations like factorial and Fibonacci calculations, along with a notepad tool to store intermediate results.

## Development

### Project Structure

- `src/` - Core source code
  - `agentLoop.ts` - Main agent loop orchestrator
  - `llmClient.ts` - Interface to the OpenAI API
  - `logger.ts` - Logging utilities
  - `promptManager.ts` - Manages context and prompt creation
  - `toolManager.ts` - Handles tool execution and results
  - `types.ts` - TypeScript type definitions
  - `index.ts` - Main exports
- `examples/` - Example usage of the agent loop
- `agentLoop.ts` - Simplified example script in the root directory

### Prerequisites

- Node.js 14+
- npm or yarn

### Building

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### Testing

```bash
# Run tests
npm test
```

## License

MIT

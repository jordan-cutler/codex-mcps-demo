import { AgentLoop, Tool } from '../src';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define some example tools
const calculatorTool: Tool = {
  name: 'calculator',
  description: 'Performs mathematical calculations',
  parameters: {
    expression: {
      type: 'string',
      description: 'The mathematical expression to calculate',
      required: true,
    },
  },
  execute: async (params: any) => {
    try {
      // IMPORTANT: Never use eval in production code
      // This is just for demonstration purposes
      const result = eval(params.expression);
      return result;
    } catch (error) {
      throw new Error(
        `Failed to evaluate expression: ${(error as Error).message}`,
      );
    }
  },
};

const weatherTool: Tool = {
  name: 'getWeather',
  description: 'Gets the current weather for a location',
  parameters: {
    location: {
      type: 'string',
      description: 'The city and state or country',
      required: true,
    },
  },
  execute: async (params: any) => {
    // This is a mock implementation
    console.log(`Getting weather for ${params.location}...`);

    // Simulate API call with random weather
    const conditions = ['sunny', 'cloudy', 'rainy', 'snowy'];
    const temperature = Math.floor(Math.random() * 35) + 40; // 40-75 F
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    return {
      location: params.location,
      temperature: `${temperature}°F`,
      condition,
      humidity: `${Math.floor(Math.random() * 60) + 30}%`,
      timestamp: new Date().toISOString(),
    };
  },
};

const dateTool: Tool = {
  name: 'getCurrentDate',
  description: 'Gets the current date and time',
  parameters: {
    timezone: {
      type: 'string',
      description: 'Optional timezone (defaults to UTC)',
      required: false,
    },
  },
  execute: async (params: any) => {
    const date = new Date();
    return {
      iso: date.toISOString(),
      readable: date.toLocaleString(undefined, {
        timeZone: params.timezone || 'UTC',
      }),
    };
  },
};

async function runExample() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }

    // Create the agent loop
    const loop = new AgentLoop({
      initialPrompt:
        'I need to solve a complex math problem and then tell me if I should have a picnic today based on the current weather in San Francisco. Also, tell me the current date.',
      tools: [calculatorTool, weatherTool, dateTool],
      llmProvider: {
        apiKey,
        model: 'gpt-4',
        temperature: 0.7,
      },
      logging: {
        enabled: true,
        level: 'info',
      },
      memory: {
        // Uncomment and add your mem0ai API key to use mem0ai for memory
        // apiKey: process.env.MEM0_API_KEY,
        userId: 'example_user',
        maxTokens: 4000,
        strategy: 'sliding',
      },
    });

    console.log('Running agent loop...');

    // Run the loop
    const result = await loop.run();

    console.log('\n\n=== FINAL ANSWER ===');
    console.log(result.finalAnswer);

    console.log('\n=== CONVERSATION SUMMARY ===');
    console.log(`Total turns: ${result.history.length}`);

    // Count tool usage
    const toolUsage: Record<string, number> = {};
    for (const message of result.history) {
      if (message.toolCalls) {
        for (const toolCall of message.toolCalls) {
          toolUsage[toolCall.name] = (toolUsage[toolCall.name] || 0) + 1;
        }
      }
    }

    console.log('Tool usage:');
    for (const [tool, count] of Object.entries(toolUsage)) {
      console.log(`- ${tool}: ${count} time(s)`);
    }
  } catch (error) {
    console.error('Error running example:', (error as Error).message);
  }
}

// Run the example
runExample();

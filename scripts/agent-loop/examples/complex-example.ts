import { AgentLoop, Tool } from '../src';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define tools for our complex example
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

// Storage for notepad tool
const notes: Record<string, string> = {};

const notepadTool: Tool = {
  name: 'notepad',
  description: 'Stores and retrieves notes for later reference',
  parameters: {
    action: {
      type: 'string',
      description: 'The action to perform: "write" or "read"',
      required: true,
    },
    key: {
      type: 'string',
      description: 'The key to store or retrieve the note under',
      required: true,
    },
    content: {
      type: 'string',
      description: 'The content to store (only required for "write" action)',
      required: false,
    },
  },
  execute: async (params: any) => {
    if (params.action === 'write') {
      if (!params.content) {
        throw new Error('Content is required for write action');
      }
      notes[params.key] = params.content;
      return { success: true, message: `Note stored under key: ${params.key}` };
    } else if (params.action === 'read') {
      const content = notes[params.key];
      if (!content) {
        return {
          success: false,
          message: `No note found for key: ${params.key}`,
        };
      }
      return { success: true, content };
    } else {
      throw new Error(
        `Invalid action: ${params.action}. Use "write" or "read".`,
      );
    }
  },
};

const fibonacciTool: Tool = {
  name: 'fibonacci',
  description: 'Calculates the Fibonacci number at a given position',
  parameters: {
    position: {
      type: 'number',
      description: 'The position in the Fibonacci sequence (0-indexed)',
      required: true,
    },
  },
  execute: async (params: any) => {
    const position = parseInt(params.position, 10);

    if (isNaN(position) || position < 0) {
      throw new Error('Position must be a non-negative integer');
    }

    if (position <= 1) {
      return position;
    }

    // Calculate Fibonacci - inefficient but simple implementation
    let a = 0,
      b = 1;
    for (let i = 2; i <= position; i++) {
      const temp = a + b;
      a = b;
      b = temp;
    }

    return b;
  },
};

const factorialTool: Tool = {
  name: 'factorial',
  description: 'Calculates the factorial of a given number',
  parameters: {
    number: {
      type: 'number',
      description: 'The number to calculate factorial for',
      required: true,
    },
  },
  execute: async (params: any) => {
    const num = parseInt(params.number, 10);

    if (isNaN(num) || num < 0) {
      throw new Error('Number must be a non-negative integer');
    }

    if (num <= 1) {
      return 1;
    }

    let result = 1;
    for (let i = 2; i <= num; i++) {
      result *= i;
    }

    return result;
  },
};

const dictionaryTool: Tool = {
  name: 'dictionary',
  description: 'Provides information about English words',
  parameters: {
    word: {
      type: 'string',
      description: 'The word to look up',
      required: true,
    },
  },
  execute: async (params: any) => {
    // Simple mock dictionary with limited entries
    const dictionary: Record<string, any> = {
      algorithm: {
        definition:
          'A process or set of rules to be followed in calculations or other problem-solving operations, especially by a computer.',
        synonyms: ['procedure', 'process', 'formula', 'method'],
        partOfSpeech: 'noun',
      },
      recursion: {
        definition:
          'The process of defining a function or calculating a number by the repeated application of an algorithm, with the result of one application being used as input for the next.',
        synonyms: ['self-reference', 'iteration', 'repetition'],
        partOfSpeech: 'noun',
      },
      fibonacci: {
        definition:
          'A sequence of numbers in which each number is the sum of the two preceding ones, usually starting with 0 and 1.',
        synonyms: ['golden sequence', 'mathematical sequence'],
        partOfSpeech: 'noun',
      },
      factorial: {
        definition:
          'The product of an integer and all the integers below it, e.g., factorial four (4!) is equal to 24.',
        synonyms: ['product sequence'],
        partOfSpeech: 'noun',
      },
      prime: {
        definition: 'A number that can only be divided evenly by 1 and itself.',
        synonyms: ['indivisible number', 'prime number'],
        partOfSpeech: 'noun',
      },
    };

    const word = params.word.toLowerCase();
    if (dictionary[word]) {
      return dictionary[word];
    } else {
      return {
        error: `Word "${params.word}" not found in dictionary.`,
        suggestions: Object.keys(dictionary).slice(0, 3), // Return some random suggestions
      };
    }
  },
};

// Main example function
async function runComplexExample() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }

    console.log('Starting complex example...');
    console.log(
      'This example demonstrates a multi-step problem-solving process',
    );
    console.log('that requires multiple iterations through the agent loop.\n');

    // Create the agent loop with all our tools
    const loop = new AgentLoop({
      initialPrompt: `
I want you to help me solve a complex mathematical puzzle step-by-step.
Please think carefully through each part of the problem.

The puzzle is:

1. Start with the factorial of 5
2. Divide it by the 7th Fibonacci number (0-indexed)
3. Add the result to the sum of the first 10 positive integers
4. Take the square root of the result
5. Calculate if the final number is a prime number
6. For any step, show your work and explain your thinking process
7. Use the notepad tool to keep track of intermediate results

Note: Remember that the Fibonacci sequence starts with 0, 1, 1, 2, 3, 5, 8, 13...
`,
      tools: [
        calculatorTool,
        notepadTool,
        fibonacciTool,
        factorialTool,
        dictionaryTool,
      ],
      llmProvider: {
        apiKey,
        model: 'gpt-4',
        temperature: 0.2, // Lower temperature for more deterministic responses
      },
      logging: {
        enabled: true,
        level: 'info',
      },
    });

    console.log('Running agent loop to solve the puzzle...\n');

    // Run the loop
    const result = await loop.run();

    console.log('\n\n=== FINAL ANSWER ===');
    console.log(result.finalAnswer);

    console.log('\n=== EXECUTION STATISTICS ===');
    console.log(`Total turns: ${result.history.length}`);

    // Count and analyze tool usage
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

    // Display the reasoning flow
    console.log('\n=== REASONING FLOW ===');
    let step = 1;
    for (let i = 0; i < result.history.length; i++) {
      const message = result.history[i];

      if (message.role === 'assistant' && message.content) {
        console.log(`\nSTEP ${step}: Agent reasoning`);
        console.log('-'.repeat(50));
        console.log(message.content.slice(0, 150) + '...'); // Show first 150 chars only

        if (message.toolCalls && message.toolCalls.length > 0) {
          console.log(
            `Tools used: ${message.toolCalls.map((tc) => tc.name).join(', ')}`,
          );
        }

        step++;
      }
    }
  } catch (error) {
    console.error('Error running complex example:', (error as Error).message);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  }
}

// Run the example
runComplexExample();

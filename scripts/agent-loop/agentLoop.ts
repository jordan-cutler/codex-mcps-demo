import { AgentLoop, Logger } from './src';

// Import environment variables
import dotenv from 'dotenv';
dotenv.config();

// Create a logger
const logger = new Logger(true, 'info');

// Check for API key
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  logger.error('Main', 'OPENAI_API_KEY not found in environment variables');
  process.exit(1);
}

// Example usage of the AgentLoop
async function main() {
  // Create an agent loop with a calculator tool
  const agentLoop = new AgentLoop({
    initialPrompt: 'Calculate the square root of 144 and then multiply it by 3',
    tools: [
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
      },
    ],
    llmProvider: {
      apiKey: apiKey as string,
      model: 'gpt-4',
      temperature: 0.7,
    },
    logging: {
      enabled: true,
      level: 'info',
    },
  });

  // Run the agent loop
  logger.info('Main', 'Starting agent loop');
  const result = await agentLoop.run();

  // Print the result
  console.log('\n=== FINAL ANSWER ===');
  console.log(result.finalAnswer);

  // Print history summary
  console.log('\n=== HISTORY SUMMARY ===');
  console.log(`Total turns: ${result.history.length}`);

  // Count tool usage
  const toolCalls = result.history.reduce((count, message) => {
    return count + (message.toolCalls?.length || 0);
  }, 0);

  console.log(`Tool calls: ${toolCalls}`);
}

// Run the main function
main().catch((error) => {
  logger.error('Main', 'Error in main function', { error });
  process.exit(1);
});

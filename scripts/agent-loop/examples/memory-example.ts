import { AgentLoop, Tool } from '../src';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define a simple calculator tool
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

// Define a function to demonstrate multi-turn memory
async function runMemoryExample() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const mem0ApiKey = process.env.MEM0_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }

    console.log('Starting memory management example...');
    console.log('This example demonstrates memory management across multiple turns.\n');

    // Create the agent loop with memory configuration
    const loop = new AgentLoop({
      initialPrompt: "Let's test your memory. My name is Jordan.",
      tools: [calculatorTool],
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
        apiKey: mem0ApiKey, // Optional, will use local memory if not provided
        userId: 'memory_example_user',
        maxTokens: 2000,    // Smaller context window to demonstrate windowing
        strategy: 'sliding',
      },
    });

    // First turn - Initial information
    console.log('\n--- TURN 1: Introduction ---');
    const result1 = await loop.run();
    console.log('Response:', result1.finalAnswer);
    console.log(`Memory size: ${result1.history.length} messages`);

    // Second turn - Test memory of name
    console.log('\n--- TURN 2: Memory Test ---');
    const result2 = await loop.run(['What is my name?']);
    console.log('Response:', result2.finalAnswer);
    console.log(`Memory size: ${result2.history.length} messages`);

    // Third turn - Adding more context
    console.log('\n--- TURN 3: Adding Context ---');
    const result3 = await loop.run(['I work at a tech company and I like hiking on weekends.']);
    console.log('Response:', result3.finalAnswer);
    console.log(`Memory size: ${result3.history.length} messages`);

    // Fourth turn - Testing memory of added context
    console.log('\n--- TURN 4: Testing Context Memory ---');
    const result4 = await loop.run(['What do I like to do on weekends?']);
    console.log('Response:', result4.finalAnswer);
    console.log(`Memory size: ${result4.history.length} messages`);

    // Fifth turn - Adding a lot of information to demonstrate windowing
    console.log('\n--- TURN 5: Adding Lots of Information ---');
    const longText = `Let me tell you about my recent hiking trip. I went to Mount Rainier National Park last weekend.
    The weather was perfect - sunny with a light breeze. I started on the Skyline Trail at Paradise and hiked up to Panorama Point.
    The views were incredible - I could see Mount Adams, Mount St. Helens, and even Mount Hood in the distance.
    I saw a family of marmots and a few deer along the way. The wildflowers were in full bloom - lupines, paintbrush, and asters covered the meadows.
    I had lunch at the top - a sandwich and some trail mix. I met a few other hikers who recommended some other trails in the area.
    On the way down, I took a detour to Myrtle Falls. The waterfall was flowing strong from all the recent snowmelt.
    I finished the hike around 5pm and drove back to Seattle. It was about a 2.5 hour drive each way, but completely worth it for the amazing experience.
    I'm planning to go back in a few weeks to try the Burroughs Mountain trail. I heard it has even better views of the mountain.
    Do you have any recommendations for other good hiking spots near Seattle?`;

    const result5 = await loop.run([longText]);
    console.log('Response:', result5.finalAnswer);
    console.log(`Memory size: ${result5.history.length} messages`);

    // Sixth turn - Test sliding window memory management (should favor recent context)
    console.log('\n--- TURN 6: Testing Sliding Window ---');
    console.log('This turn tests if the sliding window retained recent information while potentially forgetting older information.');

    const result6 = await loop.run(['What mountain did I visit recently? Also, what is my name?']);
    console.log('Response:', result6.finalAnswer);
    console.log(`Memory size: ${result6.history.length} messages`);

    // Summary
    console.log('\n=== MEMORY MANAGEMENT SUMMARY ===');
    console.log(`Final memory size: ${result6.history.length} messages`);
    console.log(`Using mem0ai: ${!!mem0ApiKey}`);

    if (mem0ApiKey) {
      console.log('Memory is persisted in mem0ai and can be retrieved across sessions.');
    } else {
      console.log('Using local memory only. Memory will be lost when the session ends.');
    }

  } catch (error) {
    console.error('Error running memory example:', (error as Error).message);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  }
}

// Run the example
runMemoryExample();
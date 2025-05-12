#!/usr/bin/env node

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, BaseMessage } from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { MemorySaver } from '@langchain/langgraph-checkpoint';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid'; // For generating default thread_ids
import console from 'console';

// Load environment variables
dotenv.config();

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('query', {
      alias: 'q',
      type: 'string',
      description: 'The query or task for the agent to perform.',
      demandOption: true,
    })
    .option('thread-id', {
      alias: 't',
      type: 'string',
      description:
        'The conversation thread ID for memory. (Default: a new UUID)',
    })
    .usage(`Usage: ${chalk.yellow('$0 -q "Your query" [-t <thread-id>]')}`)
    .help()
    .alias('h', 'help')
    .strict()
    .fail((msg, err, yargs) => {
      if (err) throw err;
      console.error(chalk.red('Error:'), msg);
      console.error(' ');
      console.error(yargs.help());
      process.exit(1);
    })
    .parseAsync();

  const userQuery = argv.query as string;
  const threadId = (argv['thread-id'] as string) || uuidv4();

  console.log(chalk.bold.magenta(`🚀 Starting Generic LangGraph Agent`));
  console.log(chalk.magenta(`   Query: "${userQuery}"`));
  console.log(chalk.magenta(`   Thread ID: ${threadId}`));
  console.log(chalk.magenta(`   OpenAI Model: gpt-4o (default)`));

  if (!process.env.OPENAI_API_KEY) {
    console.error(
      chalk.red(
        'Error: OPENAI_API_KEY is not set. Please create a .env file or set it directly.',
      ),
    );
    process.exit(1);
  }

  // 1. Setup the MCP Client to get tools
  //    The MultiServerMCPClient will fetch tool definitions from the specified server(s).
  const mcpClient = new MultiServerMCPClient({
    mcpServers: {
      filesystem: {
        command: 'npx',
        args: [
          '-y',
          '@modelcontextprotocol/server-filesystem',
          '/Users/jordancutler/workspace/codex-mcps-demo',
        ],
        transport: 'stdio',
      },
    },
  });

  let availableTools: MCPTool[] = [];
  try {
    console.log(chalk.blue('Fetching tools from MCP server...'));
    // Assuming getTools() is the method to fetch tool definitions.
    // The exact method might vary based on the mcp-adapters version or specific client features.
    // If getTools() isn't available or works differently, this part needs adjustment based on library docs.
    availableTools = await mcpClient.getTools();
    if (availableTools.length === 0) {
      console.warn(
        chalk.yellow(
          'Warning: No tools fetched from MCP server. The agent might not function as expected. Ensure the MCP server is running and accessible.',
        ),
      );
    } else {
      console.log(
        chalk.green(`Successfully fetched ${availableTools.length} tools:`),
      );
      availableTools.forEach((tool) =>
        console.log(chalk.greenBright(`  - ${tool.name}: ${tool.description}`)),
      );
    }
  } catch (error) {
    console.error(
      chalk.red('Error fetching tools from MCP server:'),
      error instanceof Error ? error.message : error,
    );
    console.error(
      chalk.red(
        'Please ensure your MCP filesystem server is running at the specified URL and is accessible.',
      ),
    );
    process.exit(1);
  }

  // 2. Setup the LLM
  const llm = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

  // 3. Setup Memory
  const checkpointer = new MemorySaver();

  // 4. Create the ReAct Agent
  //    The `createReactAgent` function simplifies creating a ReAct agent.
  //    It needs the LLM, the tools (from MCP), and a checkpointer for memory.
  const agent = createReactAgent({
    llm,
    tools: availableTools, // Pass the tools fetched from MCP
    checkpointer,
    // You can also add a system message to guide the agent's behavior if needed
    // stateModifier: "You are a helpful assistant that can interact with a filesystem."
  });

  // 5. Invoke the Agent
  const agentConfig = { configurable: { thread_id: threadId } };

  console.log(chalk.blue('\\n🔄 Invoking agent...'));

  try {
    const responseStream = await agent.stream(
      { messages: [new HumanMessage(userQuery)] },
      agentConfig,
    );

    let finalResponse: any = null;
    console.log(chalk.greenBright('\\nAgent Response Stream:'));
    for await (const event of responseStream) {
      const eventKeys = Object.keys(event);
      if (eventKeys.length === 1) {
        const key = eventKeys[0] as keyof typeof event;
        const value = event[key];
        console.log(
          chalk.cyan(`Streaming event [${key}]:`),
          typeof value === 'string'
            ? value.substring(0, 200)
            : JSON.stringify(value, null, 2),
        );

        if (key === 'messages' && Array.isArray(value) && value.length > 0) {
          const lastMessage = value[value.length - 1];
          if (
            lastMessage &&
            lastMessage.role === 'assistant' &&
            !lastMessage.tool_calls
          ) {
            finalResponse = lastMessage;
          }
        } else if (key === '__end__' && value?.messages) {
          // Check for final response structure
          const lastMessage = value.messages[value.messages.length - 1];
          if (
            lastMessage &&
            lastMessage.role === 'assistant' &&
            !lastMessage.tool_calls
          ) {
            finalResponse = lastMessage;
          }
        }
      } else {
        console.log(
          chalk.cyan('Streaming event:'),
          JSON.stringify(event, null, 2),
        );
      }
    }

    console.log(chalk.green('\\n\\n✅ Agent finished successfully.'));

    if (finalResponse) {
      console.log(chalk.blue('Final Assistant Message:'));
      console.log(finalResponse.content);
    } else {
      console.log(
        chalk.yellow(
          'No definitive final assistant message captured from the stream. Check the full stream output above.',
        ),
      );
      // As a fallback, try to get the latest state
      const finalState = await agent.getState(agentConfig);
      if (finalState && finalState.messages.length > 0) {
        const lastMessage = finalState.messages[finalState.messages.length - 1];
        if (lastMessage.role === 'assistant') {
          console.log(chalk.blue('Last assistant message from agent state:'));
          console.log(lastMessage.content);
        }
      }
    }

    // You can inspect the full conversation history like this:
    const finalState = await agent.getState(agentConfig);
    console.log(
      chalk.blue('\\nFull conversation history (Thread: ' + threadId + '):'),
    );
    finalState.messages.forEach((msg: BaseMessage, i: number) => {
      const rolePrefix =
        msg.role === 'user'
          ? chalk.green(msg.role)
          : msg.role === 'assistant'
            ? chalk.blue(msg.role)
            : chalk.yellow(msg.role);
      let contentOutput =
        typeof msg.content === 'string'
          ? msg.content
          : JSON.stringify(msg.content);
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        contentOutput += chalk.magenta(
          `\n  Tool Calls: ${JSON.stringify(msg.tool_calls)}`,
        );
      }
      // Check for tool_messages if applicable (not directly in BaseMessage but often part of agent flow)
      // if ((msg as any).tool_responses) { // Or however tool responses are structured
      //     contentOutput += chalk.yellow(`\n  Tool Responses: ${JSON.stringify((msg as any).tool_responses)}`);
      // }
      console.log(`  [${i}] ${rolePrefix}: ${contentOutput}`);
    });
  } catch (error) {
    console.error(chalk.red('\\n❌ Error running LangGraph.js agent:'));
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
      console.error(chalk.red(error.stack));
    } else {
      console.error(
        chalk.red('An unknown error occurred during agent execution.'),
        error,
      );
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red('An unexpected error occurred in main:'), error);
  process.exit(1);
});

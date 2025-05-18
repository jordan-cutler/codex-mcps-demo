import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { tool } from "@langchain/core/tools";
import { z } from 'zod';

/**
 * Create an MCP client for file operations using the built-in filesystem server
 * @returns MCP client instance
 */
export const createMCPClient = () => {
  // Get the project root directory
  const projectRoot = process.cwd();
  
  try {
    return new MultiServerMCPClient({
      mcpServers: {
        "filesystem": {
          command: "npx",
          args: [
            "-y",
            "@modelcontextprotocol/server-filesystem",
            projectRoot // Allow access to the project directory
          ],
          transport: "stdio"
        }
      }
    }) as MultiServerMCPClient;
  } catch (error) {
    console.error("Error creating MCP client:", error);
    throw error;
  }
};

/**
 * Create MCP tools for file operations
 * @returns Array of MCP tools and the client
 */
export const createMCPTools = async () => {
  try {
    const client = createMCPClient();
    
    // Get all tools from the MCP client
    const mcpTools = await client.getTools();
    
    // Create a custom code analysis tool
    const analyzeCodeTool = tool(
      async (input: { filePath: string }) => {
        try {
          // Import dynamically to avoid circular dependencies
          const { CodeAnalyzer } = await import("./codeAnalyzer");
          const analyzer = CodeAnalyzer.getInstance();
          
          // Analyze the file
          const result = await analyzer.analyzeFile(input.filePath);
          return JSON.stringify(result, null, 2);
        } catch (error: unknown) {
          if (error instanceof Error) {
            return `Error analyzing code: ${error.message}`;
          }
          return `Error analyzing code: Unknown error`;
        }
      },
      {
        name: "analyze_code",
        description: "Analyze a code file to extract structure and patterns",
        schema: z.object({
          filePath: z.string().describe("Path to the file to analyze")
        })
      }
    );
    
    // Add our custom tool to the MCP tools
    const allTools = [...mcpTools, analyzeCodeTool];
    
    return {
      tools: allTools,
      client
    };
  } catch (error) {
    console.error("Error creating MCP tools:", error);
    // Return a minimal set of tools if MCP client fails
    return {
      tools: [],
      client: null
    };
  }
};

/**
 * Close the MCP client connection
 * @param client MCP client to close
 */
export const closeMCPClient = async (client: MultiServerMCPClient | null) => {
  if (client) {
    try {
      await client.close();
    } catch (error) {
      console.error("Error closing MCP client:", error);
    }
  }
};

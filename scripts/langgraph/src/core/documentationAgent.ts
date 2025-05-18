import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();
import {
  createMemoryManager,
  getCodeAnalysis,
  storeDocumentationSection,
  addCrossReference,
  getCrossReferences,
  createRunnableWithMemory,
} from '@/core/documentationMemory';
import { createMCPTools } from '@/core/mcpConfig';

/**
 * Create a documentation generation tool
 * @returns Documentation generation tool
 */
const createDocumentationGenerationTool = () => {
  const generateDocumentationTool = tool(
    async (input: { filePath: string; section: string }) => {
      try {
        const { filePath, section } = input;

        // This would typically call an LLM to generate documentation
        // For now, we'll create a simple placeholder
        const documentation = `
# Documentation for ${filePath}

## Overview
This is an automatically generated documentation section for ${section}.

## Details
This section contains code that performs specific functionality.

## Usage
Here's how to use this code:

\`\`\`typescript
// Example usage
\`\`\`
        `;

        return documentation;
      } catch (error: unknown) {
        if (error instanceof Error) {
          return `Error generating documentation: ${error.message}`;
        }
        return `Error generating documentation: Unknown error`;
      }
    },
    {
      name: 'generate_documentation',
      description: 'Generate documentation for a code section',
      schema: z.object({
        filePath: z
          .string()
          .describe('Path to the file containing the section'),
        section: z
          .string()
          .describe('Content of the section to generate documentation for'),
      }),
    },
  );

  return generateDocumentationTool;
};

/**
 * Create a documentation agent with memory and tools
 * @returns Documentation agent and related resources
 */
export const createDocumentationAgent = async () => {
  // Initialize memory
  const { conversationMemory, memoryManager } = createMemoryManager();

  // Create MCP tools
  const mcpTools = await createMCPTools();

  // Create documentation generation tool
  const documentationGenerationTool = createDocumentationGenerationTool();


  const generateDocumentationSectionTool = tool(
    async (input: { filePath: string; sectionId: string }) => {
      try {
        // Get code analysis from memory
        const analysis = await getCodeAnalysis(memoryManager, input.filePath);
        if (!analysis) {
          return `No analysis found for ${input.filePath}. Please analyze the file first.`;
        }

        // Find the relevant section in the analysis
        const section = analysis.blocks.find(
          (block: { lineStart: number; lineEnd: number; content: string }) =>
            block.lineStart === parseInt(input.sectionId) ||
            `${input.filePath}:${block.lineStart}-${block.lineEnd}` ===
              input.sectionId,
        );

        if (!section) {
          return `Section ${input.sectionId} not found in ${input.filePath}.`;
        }

        // Generate documentation for the section
        const documentation = await documentationGenerationTool.invoke({
          filePath: input.filePath,
          section: section.content,
        });

        // Store documentation in memory
        await storeDocumentationSection(
          memoryManager,
          input.sectionId,
          documentation,
        );

        return `Generated documentation for ${input.sectionId} in ${input.filePath}.`;
      } catch (error: unknown) {
        if (error instanceof Error) {
          return `Error generating documentation section: ${error.message}`;
        }
        return `Error generating documentation section: Unknown error`;
      }
    },
    {
      name: 'generate_documentation_section',
      description: 'Generate documentation for a specific section of code',
      schema: z.object({
        filePath: z
          .string()
          .describe('Path to the file containing the section'),
        sectionId: z
          .string()
          .describe('ID of the section to generate documentation for'),
      }),
    },
  );

  const addCrossReferenceTool = tool(
    async (input: { sourceId: string; targetId: string }) => {
      try {
        // Add cross-reference to memory
        await addCrossReference(memoryManager, input.sourceId, input.targetId);

        return `Added cross-reference from ${input.sourceId} to ${input.targetId}.`;
      } catch (error: unknown) {
        if (error instanceof Error) {
          return `Error adding cross-reference: ${error.message}`;
        }
        return `Error adding cross-reference: Unknown error`;
      }
    },
    {
      name: 'add_cross_reference',
      description: 'Add a cross-reference between documentation sections',
      schema: z.object({
        sourceId: z.string().describe('ID of the source section'),
        targetId: z.string().describe('ID of the target section'),
      }),
    },
  );

  const getCrossReferencesTool = tool(
    async (input: { sectionId: string }) => {
      try {
        // Get cross-references from memory
        const crossReferences = await getCrossReferences(
          memoryManager,
          input.sectionId,
        );

        return JSON.stringify(crossReferences);
      } catch (error: unknown) {
        if (error instanceof Error) {
          return `Error getting cross-references: ${error.message}`;
        }
        return `Error getting cross-references: Unknown error`;
      }
    },
    {
      name: 'get_cross_references',
      description: 'Get cross-references for a documentation section',
      schema: z.object({
        sectionId: z
          .string()
          .describe('ID of the section to get cross-references for'),
      }),
    },
  );

  // Create a planning tool
  const createDocumentationPlanTool = tool(
    async (input: { projectPath: string; outputPath: string }) => {
      try {
        const { projectPath, outputPath } = input;

        // Return information about the project to help the agent plan
        return `Project path: ${projectPath}\nOutput path: ${outputPath}\n\nYou should now create a documentation plan by:\n1. Exploring the project structure\n2. Identifying key files and components\n3. Deciding on the documentation structure\n\nOnce you have a plan, you can execute it by analyzing files and generating documentation.`;
      } catch (error: unknown) {
        if (error instanceof Error) {
          return `Error creating documentation plan: ${error.message}`;
        }
        return `Error creating documentation plan: Unknown error`;
      }
    },
    {
      name: 'create_documentation_plan',
      description: 'Create a plan for generating documentation for a project',
      schema: z.object({
        projectPath: z.string().describe('Path to the project directory'),
        outputPath: z.string().describe('Path where documentation should be saved'),
      }),
    },
  );

  // Create a tool to execute a specific part of the documentation plan
  const executeDocumentationTaskTool = tool(
    async (input: { task: string; filePath?: string; outputPath?: string }) => {
      try {
        const { task, filePath, outputPath } = input;

        // This is a placeholder that would normally execute a specific task
        // In a real implementation, this would perform different actions based on the task type
        return `Executed task: ${task}${filePath ? ` for file ${filePath}` : ''}${outputPath ? ` with output to ${outputPath}` : ''}`;
      } catch (error: unknown) {
        if (error instanceof Error) {
          return `Error executing documentation task: ${error.message}`;
        }
        return `Error executing documentation task: Unknown error`;
      }
    },
    {
      name: 'execute_documentation_task',
      description: 'Execute a specific task in the documentation plan',
      schema: z.object({
        task: z.string().describe('Description of the task to execute'),
        filePath: z.string().optional().describe('Path to the file to process (if applicable)'),
        outputPath: z.string().optional().describe('Path where output should be saved (if applicable)'),
      }),
    },
  );

  // Combine all tools
  const tools = [
    ...mcpTools.tools, // Use all MCP tools directly
    generateDocumentationSectionTool,
    addCrossReferenceTool,
    getCrossReferencesTool,
    documentationGenerationTool,
    createDocumentationPlanTool,
    executeDocumentationTaskTool,
  ];

  // Create LLM with token limits to avoid rate limiting
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0,
    apiKey: process.env.OPENAI_API_KEY,
    maxTokens: 1000, // Limit output tokens
    maxRetries: 3,   // Limit retries on failure
  });

  // Create agent
  const agent = createReactAgent({
    llm,
    tools,
    prompt: `You are an expert documentation generator assistant. Your task is to analyze code projects and generate comprehensive documentation based on your own planning and decision making.

You have access to the following tools:
- You can read and write files
- You can list directory contents
- You can create directories
- You can analyze code files
- You can generate documentation sections
- You can add and retrieve cross-references between documentation sections

You have full autonomy to create a documentation plan and execute it. Follow this high-level process:

1. PROJECT EXPLORATION PHASE:
   - Analyze the project structure to understand the overall architecture
   - Identify key directories, files, and components
   - Determine the project's purpose, main features, and technology stack

2. PLANNING PHASE:
   - Decide which files are most important to document
   - Plan the documentation structure (e.g., overview, API docs, tutorials)
   - Determine what documentation files need to be created

3. EXECUTION PHASE:
   - Read and analyze the selected files in depth
   - Generate documentation for each important component
   - Create cross-references between related components
   - Organize documentation into logical sections
   - Create index files and navigation structure

You should prioritize understanding the big picture first, then dive into details. Focus on documenting:
- Project overview and purpose
- Architecture and design patterns
- Key components and their interactions
- APIs and interfaces
- Usage examples

Use your judgment to determine what's most important to document based on the project's nature and complexity.

Always be thorough and accurate in your documentation, focusing on clarity and usefulness for developers who need to understand and work with the code.`,
  });

  // Create runnable with memory
  const runnableWithMemory = createRunnableWithMemory(
    agent,
    conversationMemory,
  );

  return {
    agent: runnableWithMemory,
    memoryManager,
    conversationMemory,
    mcpClient: mcpTools.client,
    tools,
  };
};

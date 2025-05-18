import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import {
  createMemoryManager,
  storeCodeAnalysis,
  getCodeAnalysis,
  storeDocumentationSection,
  addCrossReference,
  getCrossReferences,
  isFileProcessed,
  createRunnableWithMemory,
} from '@/core/documentationMemory';
import { CodeAnalyzer } from '@/core/codeAnalyzer';
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
  const codeAnalyzer = CodeAnalyzer.getInstance();

  // Create MCP tools
  const mcpTools = await createMCPTools();

  // Create documentation generation tool
  const documentationGenerationTool = createDocumentationGenerationTool();

  // Create custom tools
  const analyzeFileTool = tool(
    async (input: { filePath: string }) => {
      try {
        // Check if file has already been processed
        if (await isFileProcessed(memoryManager, input.filePath)) {
          return `File ${input.filePath} has already been analyzed. Retrieving from memory.`;
        }

        // Analyze file
        const analysisResult = await codeAnalyzer.analyzeFile(input.filePath);

        // Store analysis in memory
        await storeCodeAnalysis(memoryManager, input.filePath, analysisResult);

        return `Successfully analyzed ${input.filePath} and stored results in memory.`;
      } catch (error: unknown) {
        if (error instanceof Error) {
          return `Error analyzing file: ${error.message}`;
        }
        return `Error analyzing file: Unknown error`;
      }
    },
    {
      name: 'analyze_file',
      description: 'Analyze a code file and store the results in memory',
      schema: z.object({
        filePath: z.string().describe('Path to the file to analyze'),
      }),
    },
  );

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

  // Combine all tools
  const tools = [
    ...mcpTools.tools, // Use all MCP tools directly
    analyzeFileTool,
    generateDocumentationSectionTool,
    addCrossReferenceTool,
    getCrossReferencesTool,
    documentationGenerationTool,
  ];

  // Create LLM
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0,
  });

  // Create agent
  const agent = createReactAgent({
    llm,
    tools,
    prompt: `You are an expert documentation generator assistant. Your task is to analyze code files and generate comprehensive documentation.

You have access to the following tools:
- You can read and write files
- You can list directory contents
- You can create directories
- You can analyze code files
- You can generate documentation sections
- You can add and retrieve cross-references between documentation sections

You can remember code analysis results from previous files
You can maintain context across multiple files
You can track cross-references between documentation sections

Follow this process:
1. Analyze the code file to understand its structure
2. Identify key components (functions, classes, etc.)
3. Generate documentation for each component
4. Add cross-references between related components
5. Combine all documentation into a cohesive document
6. Save the documentation to the specified output file

Always be thorough and accurate in your documentation.`,
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

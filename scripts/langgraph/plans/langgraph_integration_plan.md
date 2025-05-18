# LangGraph Integration Plan for Documentation Generation Tool

## Overview

This document outlines a comprehensive plan for integrating LangGraph into our documentation generation tool. The integration will leverage LangGraph's agent capabilities, memory management, and MCP tools for file operations to create a powerful, autonomous documentation generation system.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Dependencies](#dependencies)
3. [Core Components](#core-components)
4. [Implementation Steps](#implementation-steps)
5. [Detailed Component Implementation](#detailed-component-implementation)
6. [Testing Strategy](#testing-strategy)
7. [Deployment and Usage](#deployment-and-usage)
8. [Troubleshooting](#troubleshooting)

## Project Structure

```
langgraph/
├── src/
│   ├── cli/
│   │   └── commands/
│   │       └── document.ts
│   ├── core/
│   │   ├── codeAnalyzer.ts
│   │   ├── documentationAgent.ts     # New file for LangGraph agent
│   │   ├── documentationMemory.ts    # New file for memory management
│   │   ├── mcpConfig.ts              # New file for MCP tools
│   │   ├── documentationGenerator.ts # Updated to use LangGraph
│   │   └── templateEngine.ts
│   ├── models/
│   │   └── types.ts                  # Updated with new types
│   └── utils/
│       ├── fileSystem.ts
│       └── markdown.ts
├── templates/
│   └── default.md
├── package.json                      # Updated with new dependencies
├── tsconfig.json
└── README.md                         # Updated with new usage instructions
```

## Dependencies

Update `package.json` to include the following dependencies:

```json
{
  "dependencies": {
    "@langchain/core": "^0.3.56",
    "@langchain/langgraph": "^0.2.72",
    "@langchain/openai": "^0.0.10",
    "@langchain/community": "^0.0.10",
    "@langchain/mcp": "^0.0.1",
    "chalk": "^4.1.2",
    "commander": "^10.0.0",
    "fs-extra": "^11.1.1",
    "glob": "^10.0.0",
    "marked": "^10.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "jest": "^29.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Core Components

### 1. Documentation Memory (`documentationMemory.ts`)

This component will manage both short-term and long-term memory for the documentation agent:

- **Short-term memory**: For maintaining conversation context during a documentation generation session
- **Long-term memory**: For storing code analysis results and documentation sections across multiple files

### 2. MCP Configuration (`mcpConfig.ts`)

This component will configure MCP tools for file operations:

- **Read File Tool**: For reading code files directly
- **Write File Tool**: For writing documentation files
- **List Directory Tool**: For listing directory contents
- **Create Directory Tool**: For creating directory structures

### 3. Documentation Agent (`documentationAgent.ts`)

This component will create a LangGraph agent with memory and MCP tools:

- **Agent Creation**: Using `createReactAgent` from LangGraph
- **Tool Integration**: Integrating custom tools and MCP tools
- **Memory Integration**: Integrating short-term and long-term memory
- **Prompt Engineering**: Creating a comprehensive prompt for the agent

### 4. Documentation Generator (`documentationGenerator.ts`)

This component will be updated to use the LangGraph agent:

- **Agent Initialization**: Initializing the agent with memory and tools
- **Documentation Generation**: Using the agent to generate documentation
- **Directory Processing**: Processing entire directories for documentation

## Implementation Steps

1. Update dependencies in `package.json`
2. Create the memory management system in `documentationMemory.ts`
3. Configure MCP tools in `mcpConfig.ts`
4. Create the documentation agent in `documentationAgent.ts`
5. Update the documentation generator in `documentationGenerator.ts`
6. Update the CLI command to use the new agent-based approach
7. Test the integration
8. Update documentation

## Detailed Component Implementation

### 1. Documentation Memory (`src/core/documentationMemory.ts`)

```typescript
import { BufferWindowMemory } from "@langchain/community/memory";
import { ChatMessageHistory } from "@langchain/community/stores/message/in_memory";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { MemoryManager } from "@langchain/langgraph/memory";
import { BaseMessage } from "@langchain/core/messages";

// Define memory interfaces
export interface DocumentationMemory {
  codeAnalysisResults: Record<string, any>;
  documentationSections: Record<string, any>;
  crossReferences: Record<string, string[]>;
  processedFiles: string[];
}

// Create initial memory state
export const createInitialMemory = (): DocumentationMemory => {
  return {
    codeAnalysisResults: {},
    documentationSections: {},
    crossReferences: {},
    processedFiles: []
  };
};

// Create memory manager
export const createMemoryManager = () => {
  // Short-term conversation memory
  const conversationMemory = new BufferWindowMemory({
    k: 5, // Keep last 5 interactions
    returnMessages: true,
    memoryKey: "chat_history",
    inputKey: "input"
  });
  
  // Long-term memory for documentation context
  const documentationMemory = createInitialMemory();
  
  // Create memory manager
  const memoryManager = new MemoryManager({
    memory: documentationMemory,
    getSessionId: () => "documentation_session"
  });
  
  return {
    conversationMemory,
    documentationMemory,
    memoryManager
  };
};

// Memory utilities
export const storeCodeAnalysis = async (
  memoryManager: MemoryManager,
  filePath: string,
  analysisResult: any
) => {
  const memory = await memoryManager.getMemory();
  memory.codeAnalysisResults[filePath] = analysisResult;
  memory.processedFiles.push(filePath);
  await memoryManager.updateMemory(memory);
};

export const getCodeAnalysis = async (
  memoryManager: MemoryManager,
  filePath: string
) => {
  const memory = await memoryManager.getMemory();
  return memory.codeAnalysisResults[filePath] || null;
};

export const storeDocumentationSection = async (
  memoryManager: MemoryManager,
  sectionId: string,
  section: any
) => {
  const memory = await memoryManager.getMemory();
  memory.documentationSections[sectionId] = section;
  await memoryManager.updateMemory(memory);
};

export const getDocumentationSection = async (
  memoryManager: MemoryManager,
  sectionId: string
) => {
  const memory = await memoryManager.getMemory();
  return memory.documentationSections[sectionId] || null;
};

export const storeCrossReference = async (
  memoryManager: MemoryManager,
  sourceId: string,
  targetId: string
) => {
  const memory = await memoryManager.getMemory();
  if (!memory.crossReferences[sourceId]) {
    memory.crossReferences[sourceId] = [];
  }
  memory.crossReferences[sourceId].push(targetId);
  await memoryManager.updateMemory(memory);
};

export const getCrossReferences = async (
  memoryManager: MemoryManager,
  sourceId: string
) => {
  const memory = await memoryManager.getMemory();
  return memory.crossReferences[sourceId] || [];
};
```

### 2. MCP Configuration (`src/core/mcpConfig.ts`)

```typescript
import { MCPClient } from "@langchain/mcp";
import { MCPTool } from "@langchain/mcp/tools";

// Create MCP client
export const createMCPClient = () => {
  return new MCPClient({
    serverName: "filesystem",
    serverUrl: "http://localhost:8080" // Adjust as needed
  });
};

// Create MCP tools
export const createMCPTools = async () => {
  const client = createMCPClient();
  
  // File reading tool
  const readFileTool = await MCPTool.fromServerName({
    serverName: "filesystem",
    toolName: "read_file",
    description: "Read the contents of a file",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file to read"
        }
      },
      required: ["path"]
    }
  });
  
  // File writing tool
  const writeFileTool = await MCPTool.fromServerName({
    serverName: "filesystem",
    toolName: "write_file",
    description: "Write content to a file",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file to write"
        },
        content: {
          type: "string",
          description: "Content to write to the file"
        }
      },
      required: ["path", "content"]
    }
  });
  
  // List directory tool
  const listDirectoryTool = await MCPTool.fromServerName({
    serverName: "filesystem",
    toolName: "list_directory",
    description: "List files in a directory",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the directory to list"
        }
      },
      required: ["path"]
    }
  });
  
  // Create directory tool
  const createDirectoryTool = await MCPTool.fromServerName({
    serverName: "filesystem",
    toolName: "create_directory",
    description: "Create a directory",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the directory to create"
        }
      },
      required: ["path"]
    }
  });
  
  return {
    readFileTool,
    writeFileTool,
    listDirectoryTool,
    createDirectoryTool
  };
};
```

### 3. Documentation Agent (`src/core/documentationAgent.ts`)

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/agents";
import { AgentExecutor } from "@langchain/langgraph/agents";
import { Tool } from "@langchain/core/tools";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { CodeAnalyzer } from "./codeAnalyzer";
import { TemplateEngine } from "./templateEngine";
import { MarkdownFormatter } from "../utils/markdown";
import { 
  createMemoryManager, 
  storeCodeAnalysis, 
  getCodeAnalysis,
  storeDocumentationSection,
  getDocumentationSection,
  storeCrossReference,
  getCrossReferences
} from "./documentationMemory";
import { createMCPTools } from "./mcpConfig";

// Create memory manager
const { conversationMemory, documentationMemory, memoryManager } = createMemoryManager();

// Define the agent's tools
const analyzeCodeTool = new Tool({
  name: "analyze_code",
  description: "Analyze a code file to extract semantic information",
  func: async (filePath: string) => {
    try {
      // Check if we already analyzed this file
      const existingAnalysis = await getCodeAnalysis(memoryManager, filePath);
      if (existingAnalysis) {
        return `Using cached analysis for ${filePath}: ${JSON.stringify(existingAnalysis)}`;
      }
      
      // Analyze the file
      const codeAnalyzer = CodeAnalyzer.getInstance();
      const analysisResult = await codeAnalyzer.analyzeFile(filePath);
      
      // Store the analysis in memory
      await storeCodeAnalysis(memoryManager, filePath, analysisResult);
      
      return JSON.stringify(analysisResult);
    } catch (error) {
      return `Error analyzing code: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
});

const generateDocumentationTool = new Tool({
  name: "generate_documentation",
  description: "Generate documentation for a code section",
  func: async (input: string) => {
    try {
      // Parse input to get file path and section
      const { filePath, section } = JSON.parse(input);
      
      // Get code analysis from memory
      const analysis = await getCodeAnalysis(memoryManager, filePath);
      if (!analysis) {
        return "Error: No code analysis found for this file. Please analyze the file first.";
      }
      
      // Generate documentation for the section
      const documentation = {
        title: section || "Overview",
        content: `Documentation for ${filePath}`,
        codeBlocks: analysis.blocks || [],
        relatedSections: [],
        lastUpdated: new Date().toISOString()
      };
      
      // Store documentation in memory
      const sectionId = `${filePath}:${section || "Overview"}`;
      await storeDocumentationSection(memoryManager, sectionId, documentation);
      
      return JSON.stringify(documentation);
    } catch (error) {
      return `Error generating documentation: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
});

const formatMarkdownTool = new Tool({
  name: "format_markdown",
  description: "Format documentation as Markdown with cross-references",
  func: async (input: string) => {
    try {
      const markdownFormatter = MarkdownFormatter.getInstance();
      const { sections } = JSON.parse(input);
      
      // Get documentation sections from memory
      const documentationSections = [];
      for (const sectionId of sections) {
        const section = await getDocumentationSection(memoryManager, sectionId);
        if (section) {
          documentationSections.push(section);
        }
      }
      
      // Format documentation with Markdown
      const formattedContent = markdownFormatter.formatSections(documentationSections);
      
      // Add cross-references
      const contentWithCrossRefs = markdownFormatter.addCrossReferences(
        formattedContent, 
        documentationSections
      );
      
      return contentWithCrossRefs;
    } catch (error) {
      return `Error formatting Markdown: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
});

const applyTemplateTool = new Tool({
  name: "apply_template",
  description: "Apply a template to documentation",
  func: async (input: string) => {
    try {
      const templateEngine = TemplateEngine.getInstance();
      const { content, templateName, templatePath, variables } = JSON.parse(input);
      
      // Apply template
      const templateConfig = {
        name: templateName || "default",
        path: templatePath || "",
        variables: variables || {
          title: "Documentation",
          lastUpdated: new Date().toISOString().split("T")[0]
        }
      };
      
      const memory = await memoryManager.getMemory();
      const sections = Object.values(memory.documentationSections);
      const templatedContent = await templateEngine.applyTemplate(sections, templateConfig);
      
      return templatedContent;
    } catch (error) {
      return `Error applying template: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
});

const addCrossReferenceTool = new Tool({
  name: "add_cross_reference",
  description: "Add a cross-reference between documentation sections",
  func: async (input: string) => {
    try {
      const { sourceId, targetId } = JSON.parse(input);
      
      // Store cross-reference in memory
      await storeCrossReference(memoryManager, sourceId, targetId);
      
      return `Added cross-reference from ${sourceId} to ${targetId}`;
    } catch (error) {
      return `Error adding cross-reference: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
});

// Define the agent's prompt
const prompt = `You are a documentation generation agent with memory capabilities and file editing tools. Your task is to analyze code files and generate comprehensive documentation.

When analyzing code, focus on:
1. Understanding the code structure
2. Identifying functions, classes, and dependencies
3. Extracting semantic meaning from code comments and patterns
4. Creating clear and concise documentation

You have access to the following tools:
- analyze_code: Analyze a code file to extract semantic information
- generate_documentation: Generate documentation for a code section
- format_markdown: Format documentation as Markdown with cross-references
- apply_template: Apply a template to documentation
- add_cross_reference: Add a cross-reference between documentation sections
- read_file: Read the contents of a file
- write_file: Write content to a file
- list_directory: List files in a directory
- create_directory: Create a directory

You also have memory capabilities:
- You can remember code analysis results from previous files
- You can maintain context across multiple files
- You can track cross-references between documentation sections

Follow this process:
1. Analyze each code file (use read_file to get the content, then analyze_code)
2. Generate documentation sections for each file
3. Format the documentation with Markdown, including cross-references
4. Apply the template to the documentation
5. Create the output directory structure (use create_directory)
6. Write the documentation files (use write_file)

Always check your memory before performing duplicate work.
`;

// Create the agent with memory and MCP tools
export const createDocumentationAgent = async () => {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0
  });

  // Get MCP tools
  const mcpTools = await createMCPTools();
  
  const tools = [
    analyzeCodeTool, 
    generateDocumentationTool, 
    formatMarkdownTool, 
    applyTemplateTool,
    addCrossReferenceTool,
    mcpTools.readFileTool,
    mcpTools.writeFileTool,
    mcpTools.listDirectoryTool,
    mcpTools.createDirectoryTool
  ];
  
  // Create agent with memory
  const agent = await createReactAgent({
    llm,
    tools,
    prompt
  });
  
  // Create a sequence that includes memory
  const agentWithMemory = RunnableSequence.from([
    {
      input: new RunnablePassthrough(),
      memory: async () => {
        const memoryResult = await conversationMemory.loadMemoryVariables({});
        return memoryResult.chat_history || [];
      }
    },
    agent,
    {
      result: new RunnablePassthrough(),
      memory: async (input, config) => {
        await conversationMemory.saveContext(
          { input: input.input },
          { output: input.result }
        );
        return input.result;
      }
    }
  ]);
  
  const agentExecutor = new AgentExecutor({
    agent: agentWithMemory,
    tools
  });
  
  return {
    agentExecutor,
    memoryManager
  };
};
```

### 4. Updated Documentation Generator (`src/core/documentationGenerator.ts`)

```typescript
import { DocumentationSection } from '@/models/types';
import { createDocumentationAgent } from './documentationAgent';
import { join } from 'path';

export class DocumentationGenerator {
  private static instance: DocumentationGenerator;
  private agent: any;
  private memoryManager: any;
  private initialized: boolean = false;
  
  private constructor() {}
  
  public static getInstance(): DocumentationGenerator {
    if (!DocumentationGenerator.instance) {
      DocumentationGenerator.instance = new DocumentationGenerator();
    }
    return DocumentationGenerator.instance;
  }
  
  public async initialize() {
    if (!this.initialized) {
      const { agentExecutor, memoryManager } = await createDocumentationAgent();
      this.agent = agentExecutor;
      this.memoryManager = memoryManager;
      this.initialized = true;
    }
  }
  
  public async generateDocumentation(
    filePath: string, 
    outputPath: string
  ): Promise<DocumentationSection[]> {
    try {
      // Initialize the agent if not already initialized
      await this.initialize();
      
      // Execute the agent with the file path and output path
      const result = await this.agent.invoke({
        input: `Generate documentation for the file at ${filePath} and save it to ${outputPath}. 
                First read the file, then analyze it, then generate documentation, and finally write the documentation to the output path.`
      });
      
      // Get documentation sections from memory
      const memory = await this.memoryManager.getMemory();
      const sections = Object.values(memory.documentationSections);
      
      // Filter sections for the current file
      const fileSections = sections.filter((section: any) => 
        section.title.includes(filePath) || 
        section.content.includes(filePath)
      );
      
      return fileSections as DocumentationSection[];
    } catch (error) {
      console.error('Error generating documentation:', error);
      throw error;
    }
  }
  
  public async generateDocumentationForDirectory(
    directoryPath: string,
    outputPath: string,
    fileConfig: { include: string[], exclude: string[] }
  ): Promise<void> {
    try {
      // Initialize the agent if not already initialized
      await this.initialize();
      
      // Execute the agent to generate documentation for the directory
      await this.agent.invoke({
        input: `Generate documentation for all files in the directory at ${directoryPath} and save it to ${outputPath}.
                Include files matching these patterns: ${fileConfig.include.join(', ')}
                Exclude files matching these patterns: ${fileConfig.exclude.join(', ')}
                
                Follow these steps:
                1. List all files in the directory
                2. Filter files based on the include/exclude patterns
                3. For each file:
                   a. Read the file
                   b. Analyze the code
                   c. Generate documentation
                4. Create the output directory structure
                5. Write the documentation files
                6. Create an index.md file with links to all documentation files`
      });
      
      console.log(`Documentation generated successfully in ${outputPath}`);
    } catch (error) {
      console.error('Error generating documentation for directory:', error);
      throw error;
    }
  }
}
```

## Testing Strategy

### 1. Unit Tests

Create unit tests for each component:

```typescript
// Test memory management
describe('Documentation Memory', () => {
  it('should store and retrieve code analysis', async () => {
    const { memoryManager } = createMemoryManager();
    const filePath = '/path/to/file.ts';
    const analysis = { blocks: [{ name: 'test', type: 'function' }] };
    
    await storeCodeAnalysis(memoryManager, filePath, analysis);
    const retrieved = await getCodeAnalysis(memoryManager, filePath);
    
    expect(retrieved).toEqual(analysis);
  });
});

// Test MCP tools configuration
describe('MCP Tools', () => {
  it('should create MCP tools', async () => {
    const tools = await createMCPTools();
    
    expect(tools.readFileTool).toBeDefined();
    expect(tools.writeFileTool).toBeDefined();
    expect(tools.listDirectoryTool).toBeDefined();
    expect(tools.createDirectoryTool).toBeDefined();
  });
});

// Test agent creation
describe('Documentation Agent', () => {
  it('should create an agent with tools and memory', async () => {
    const { agentExecutor, memoryManager } = await createDocumentationAgent();
    
    expect(agentExecutor).toBeDefined();
    expect(memoryManager).toBeDefined();
  });
});
```

### 2. Integration Tests

Create integration tests for end-to-end functionality:

```typescript
describe('Documentation Generation', () => {
  it('should generate documentation for a single file', async () => {
    const documentationGenerator = DocumentationGenerator.getInstance();
    const filePath = '/path/to/test/file.ts';
    const outputPath = '/path/to/output';
    
    const sections = await documentationGenerator.generateDocumentation(filePath, outputPath);
    
    expect(sections.length).toBeGreaterThan(0);
    // Check that the output file exists
    expect(fs.existsSync(`${outputPath}/file.md`)).toBe(true);
  });
  
  it('should generate documentation for a directory', async () => {
    const documentationGenerator = DocumentationGenerator.getInstance();
    const directoryPath = '/path/to/test/directory';
    const outputPath = '/path/to/output';
    const fileConfig = {
      include: ['*.ts'],
      exclude: ['node_modules']
    };
    
    await documentationGenerator.generateDocumentationForDirectory(
      directoryPath,
      outputPath,
      fileConfig
    );
    
    // Check that the output directory exists
    expect(fs.existsSync(outputPath)).toBe(true);
    // Check that the index file exists
    expect(fs.existsSync(`${outputPath}/index.md`)).toBe(true);
  });
});
```

### 3. Manual Testing

Perform manual testing with different file types and directory structures:

1. Test with TypeScript files
2. Test with JavaScript files
3. Test with different directory structures
4. Test with different templates
5. Test cross-referencing between documentation sections

## Deployment and Usage

### Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build
```

### Usage

```bash
# Generate documentation for a file
pnpm document path/to/file.ts

# Generate documentation for a directory
pnpm document path/to/directory

# Generate documentation with custom output directory
pnpm document path/to/directory -o path/to/output

# Use a specific template
pnpm document path/to/directory -t custom-template

# Include only specific file patterns
pnpm document path/to/directory -i "*.ts" "*.js"

# Exclude specific patterns
pnpm document path/to/directory -e "node_modules" "dist"

# Use a configuration file
pnpm document path/to/directory -c config.json

# Force overwrite of existing files
pnpm document path/to/directory -f

# Enable verbose output
pnpm document path/to/directory -v
```

### Configuration

You can create a configuration file to customize the documentation generation:

```json
{
  "input": "./src",
  "output": "./docs",
  "template": {
    "name": "default",
    "path": "",
    "variables": {
      "title": "Documentation",
      "lastUpdated": "2025-05-18"
    }
  },
  "fileConfig": {
    "include": ["*.ts", "*.js"],
    "exclude": ["node_modules", ".git", "dist", "build", "test"]
  }
}
```

## Troubleshooting

### Common Issues

1. **MCP Server Not Running**:
   - Error: `Cannot connect to MCP server`
   - Solution: Ensure the MCP server is running at the specified URL

2. **Missing Dependencies**:
   - Error: `Cannot find module '@langchain/mcp'`
   - Solution: Run `pnpm install` to install all dependencies

3. **Memory Issues**:
   - Error: `JavaScript heap out of memory`
   - Solution: Increase Node.js memory limit with `NODE_OPTIONS=--max-old-space-size=8192`

4. **File Access Issues**:
   - Error: `EACCES: permission denied`
   - Solution: Ensure the process has permission to read/write the specified files

5. **API Key Issues**:
   - Error: `Error: Missing OpenAI API key`
   - Solution: Set the `OPENAI_API_KEY` environment variable

### Debugging

1. Enable verbose logging with the `-v` flag
2. Check the agent's memory for stored information
3. Inspect the MCP server logs for file operation issues
4. Use the `--debug` flag for more detailed logging

### Getting Help

If you encounter issues not covered in this troubleshooting guide, please:

1. Check the LangGraph documentation: https://langchain-ai.github.io/langgraphjs/
2. Check the MCP documentation: https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem
3. Open an issue on the project repository

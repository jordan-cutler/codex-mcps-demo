import { CodeAnalyzer, CodeAnalysisResult } from '@/core/codeAnalyzer';
import { DocumentationSection } from '@/models/types';
import { createDocumentationAgent } from '@/core/documentationAgent';
import path from 'path';

/**
 * Interface for the agent result
 */
interface AgentResult {
  output: string;
  sections?: DocumentationSection[];
}

/**
 * DocumentationGenerator class
 * Responsible for generating documentation for code files using LangGraph
 */
export class DocumentationGenerator {
  private static instance: DocumentationGenerator;
  private codeAnalyzer: CodeAnalyzer;
  private agent!: Awaited<ReturnType<typeof createDocumentationAgent>>['agent'];
  private initialized: boolean = false;

  private constructor() {
    this.codeAnalyzer = CodeAnalyzer.getInstance();
  }

  public static getInstance(): DocumentationGenerator {
    if (!DocumentationGenerator.instance) {
      DocumentationGenerator.instance = new DocumentationGenerator();
    }
    return DocumentationGenerator.instance;
  }

  /**
   * Initialize the documentation agent
   * This should be called before using the generator
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const { agent } = await createDocumentationAgent();
      this.agent = agent;
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing documentation agent:', error);
      throw error;
    }
  }

  /**
   * Generate documentation for a file
   * @param filePath Path to the file
   * @returns Generated documentation sections
   */
  public async generateDocumentation(filePath: string): Promise<DocumentationSection[]> {
    // Ensure the agent is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Analyze the code file
      const codeAnalysis = await this.codeAnalyzer.analyzeFile(filePath);

      // Use the LangGraph agent to generate documentation
      const result = await this.agent.invoke({
        input: `Generate documentation for the file at ${filePath}`,
        context: {
          filePath,
          codeAnalysis: JSON.stringify(codeAnalysis)
        }
      });

      // Parse and return the documentation sections
      return this.parseDocumentationResult(result, filePath, codeAnalysis);
    } catch (error) {
      console.error('Error generating documentation:', error);
      throw error;
    }
  }

  /**
   * Generate documentation for multiple files
   * @param filePaths Array of file paths
   * @returns Generated documentation sections by file path
   */
  public async generateDocumentationForFiles(filePaths: string[]): Promise<Record<string, DocumentationSection[]>> {
    // Ensure the agent is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    const results: Record<string, DocumentationSection[]> = {};
    
    // Process files in smaller batches to avoid rate limits
    const BATCH_SIZE = 3;
    const DELAY_BETWEEN_BATCHES_MS = 5000; // 5 seconds delay between batches
    
    // Split files into batches
    const batches: string[][] = [];
    for (let i = 0; i < filePaths.length; i += BATCH_SIZE) {
      batches.push(filePaths.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Processing ${filePaths.length} files in ${batches.length} batches of up to ${BATCH_SIZE} files each`);
    
    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} files)`);
      
      // Process files in the current batch
      for (const filePath of batch) {
        try {
          console.log(`  Processing file: ${filePath}`);
          const sections = await this.generateDocumentation(filePath);
          results[filePath] = sections;
          console.log(`  ✓ Completed: ${filePath}`);
        } catch (error: unknown) {
          // Check if error is an object with a code property
          if (error && typeof error === 'object' && 'code' in error && error.code === 'rate_limit_exceeded') {
            console.error(`  ⚠️ Rate limit exceeded for ${filePath}. Creating basic documentation instead.`);
            // Create basic documentation instead of using the LLM
            try {
              const codeAnalysis = await this.codeAnalyzer.analyzeFile(filePath);
              results[filePath] = this.createBasicDocumentationSections(filePath, codeAnalysis);
            } catch (fallbackError) {
              console.error(`  ❌ Failed to create basic documentation for ${filePath}:`, fallbackError);
              results[filePath] = [];
            }
          } else {
            console.error(`  ❌ Error generating documentation for ${filePath}:`, error);
            results[filePath] = [];
          }
        }
      }
      
      // Add delay between batches, except for the last batch
      if (batchIndex < batches.length - 1) {
        console.log(`Waiting ${DELAY_BETWEEN_BATCHES_MS/1000} seconds before processing next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
      }
    }

    return results;
  }

  /**
   * Generate documentation for a project directory using the agent-driven approach
   * @param directoryPath Path to the project directory
   * @param outputPath Path where documentation should be saved
   * @param options Configuration options
   * @returns Generated documentation by file path
   */
  public async generateProjectDocumentation(
    directoryPath: string,
    outputPath: string,
    options: {
      extensions?: string[];
      excludeDirs?: string[];
      maxFiles?: number;
    } = {}
  ): Promise<Record<string, DocumentationSection[]>> {
    // Ensure the agent is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('Starting agent-driven documentation generation...');
      console.log(`Project directory: ${directoryPath}`);
      console.log(`Output directory: ${outputPath}`);
      
      // Let the agent create and execute a documentation plan
      const result = await this.agent.invoke({
        input: `Generate comprehensive documentation for the project at ${directoryPath}. Save the documentation to ${outputPath}.`,
        context: {
          projectPath: directoryPath,
          outputPath: outputPath,
          options: JSON.stringify(options),
        }
      });
      
      console.log('Documentation generation completed.');
      
      // Parse the results
      if (typeof result === 'object' && result !== null && 'sections' in result && Array.isArray(result.sections)) {
        // If the agent returned structured sections, use them
        const sections = result.sections as DocumentationSection[];
        return { [directoryPath]: sections };
      } else {
        // Otherwise, create a simple result
        const section: DocumentationSection = {
          title: 'Project Documentation',
          content: typeof result === 'object' && result !== null && 'output' in result ? 
            String(result.output) : 
            'Documentation generated successfully.',
          codeBlocks: [],
          relatedSections: [],
          lastUpdated: new Date().toISOString()
        };
        
        return { [directoryPath]: [section] };
      }
    } catch (error) {
      console.error('Error generating project documentation:', error);
      throw error;
    }
  }

  /**
   * Find files in a directory with specific extensions
   * @param directoryPath Directory to search
   * @param extensions File extensions to include
   * @param excludeDirs Directories to exclude
   * @returns Array of file paths
   */
  private async findFilesInDirectory(
    directoryPath: string,
    extensions: string[],
    excludeDirs: string[]
  ): Promise<string[]> {
    try {
      // Use the fs module to recursively find files
      const { promises: fs } = await import('fs');
      const { join } = await import('path');

      const results: string[] = [];

      async function walkDir(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dir, entry.name);

          if (entry.isDirectory()) {
            // Skip excluded directories
            if (!excludeDirs.includes(entry.name)) {
              await walkDir(fullPath);
            }
          } else if (entry.isFile()) {
            // Check if file has one of the specified extensions
            if (extensions.some(ext => entry.name.endsWith(ext))) {
              results.push(fullPath);
            }
          }
        }
      }

      await walkDir(directoryPath);
      return results;
    } catch (error) {
      console.error('Error finding files in directory:', error);
      return [];
    }
  }

  /**
   * Parse the result from the documentation agent
   * @param result Result from the agent
   * @param filePath File path for context
   * @param codeAnalysis Code analysis result for fallback
   * @returns Array of documentation sections
   */
  private parseDocumentationResult(
    result: unknown,
    filePath: string,
    codeAnalysis?: CodeAnalysisResult
  ): DocumentationSection[] {
    try {
      // If the result already contains sections, use them
      const agentResult = result as AgentResult;
      if (agentResult.sections && Array.isArray(agentResult.sections)) {
        return agentResult.sections;
      }

      // If we have output, create a section from it
      if (typeof agentResult.output === 'string') {
        const fileName = path.basename(filePath);
        const section: DocumentationSection = {
          title: `Documentation for ${fileName}`,
          content: agentResult.output,
          codeBlocks: [],
          relatedSections: [],
          lastUpdated: new Date().toISOString()
        };

        return [section];
      }

      // If we have code analysis but no output, create basic sections
      if (codeAnalysis) {
        return this.createBasicDocumentationSections(filePath, codeAnalysis);
      }

      // Fallback to a simple section
      return [{
        title: `Documentation for ${path.basename(filePath)}`,
        content: 'Documentation could not be generated with the available information.',
        codeBlocks: [],
        relatedSections: [],
        lastUpdated: new Date().toISOString()
      }];
    } catch (error) {
      console.error('Error parsing documentation result:', error);
      // Return a fallback section
      return [{
        title: `Documentation for ${path.basename(filePath)}`,
        content: 'Error generating documentation. Please try again.',
        codeBlocks: [],
        relatedSections: [],
        lastUpdated: new Date().toISOString()
      }];
    }
  }

  /**
   * Create basic documentation sections from code analysis
   * @param filePath File path
   * @param codeAnalysis Code analysis result
   * @returns Array of documentation sections
   */
  private createBasicDocumentationSections(
    filePath: string,
    codeAnalysis: CodeAnalysisResult
  ): DocumentationSection[] {
    const fileName = path.basename(filePath);
    const sections: DocumentationSection[] = [];

    // Create overview section
    const overviewSection: DocumentationSection = {
      title: 'Overview',
      content: `
# ${fileName}

## Overview

This file contains ${codeAnalysis.functions.length} functions and ${codeAnalysis.classes.length} classes.
It has ${codeAnalysis.imports.length} imports and ${codeAnalysis.exports.length} exports.

${codeAnalysis.patterns.async ? 'This file uses asynchronous patterns.\n' : ''}
${codeAnalysis.patterns.functional ? 'This file uses functional programming patterns.\n' : ''}
${codeAnalysis.patterns.objectOriented ? 'This file uses object-oriented programming patterns.\n' : ''}
      `,
      codeBlocks: [],
      relatedSections: ['Functions', 'Classes', 'Dependencies'],
      lastUpdated: new Date().toISOString()
    };

    sections.push(overviewSection);

    // Create functions section if there are functions
    if (codeAnalysis.functions.length > 0) {
      const functionsSection: DocumentationSection = {
        title: 'Functions',
        content: `
# Functions

This file contains the following functions:

${codeAnalysis.functions.map(func => `- \`${func}\``).join('\n')}
        `,
        codeBlocks: codeAnalysis.blocks.filter(block =>
          codeAnalysis.functions.some(func => block.content.includes(func))
        ),
        relatedSections: ['Overview', 'Classes'],
        lastUpdated: new Date().toISOString()
      };

      sections.push(functionsSection);
    }

    // Create classes section if there are classes
    if (codeAnalysis.classes.length > 0) {
      const classesSection: DocumentationSection = {
        title: 'Classes',
        content: `
# Classes

This file contains the following classes:

${codeAnalysis.classes.map(cls => `- \`${cls}\``).join('\n')}
        `,
        codeBlocks: codeAnalysis.blocks.filter(block =>
          codeAnalysis.classes.some(cls => block.content.includes(`class ${cls}`))
        ),
        relatedSections: ['Overview', 'Functions'],
        lastUpdated: new Date().toISOString()
      };

      sections.push(classesSection);
    }

    // Create dependencies section if there are imports
    if (codeAnalysis.imports.length > 0) {
      const dependenciesSection: DocumentationSection = {
        title: 'Dependencies',
        content: `
# Dependencies

This file imports the following dependencies:

${codeAnalysis.imports.map(dep => `- \`${dep}\``).join('\n')}
        `,
        codeBlocks: [],
        relatedSections: ['Overview'],
        lastUpdated: new Date().toISOString()
      };

      sections.push(dependenciesSection);
    }

    return sections;
  }
}

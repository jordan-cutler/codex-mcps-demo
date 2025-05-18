#!/usr/bin/env node

import { Command } from 'commander';
import { DocumentationGenerator } from '@/core/documentationGenerator';
import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';
// @ts-expect-error - ora doesn't have type definitions
import ora from 'ora';

/**
 * Main CLI program for LangGraph Documentation Generator
 */
async function main() {
  const program = new Command();
  
  program
    .name('langgraph-docs')
    .description('Generate documentation for your code using LangGraph')
    .version('1.0.0');
  
  program
    .command('generate')
    .description('Generate documentation for a file or directory')
    .argument('<path>', 'Path to file or directory')
    .option('-o, --output <dir>', 'Output directory for documentation', './docs')
    .option('-e, --extensions <exts>', 'File extensions to include (comma separated)', '.ts,.js,.tsx,.jsx')
    .option('-x, --exclude <dirs>', 'Directories to exclude (comma separated)', 'node_modules,dist,build,.git')
    .option('-m, --max <number>', 'Maximum number of files to process', '50')
    .action(async (targetPath, options) => {
      try {
        const spinner = ora('Initializing documentation generator...').start();
        
        // Get absolute paths
        const inputPath = path.resolve(targetPath);
        const outputDir = path.resolve(options.output);
        
        // Parse options
        const extensions = options.extensions.split(',');
        const excludeDirs = options.exclude.split(',');
        const maxFiles = parseInt(options.max, 10);
        
        // Check if input path exists
        try {
          const stats = await fs.stat(inputPath);
          if (!stats.isDirectory() && !stats.isFile()) {
            spinner.fail(`Invalid path: ${inputPath}`);
            return;
          }
        } catch {
          spinner.fail(`Path does not exist: ${inputPath}`);
          return;
        }
        
        // Create output directory if it doesn't exist
        await fs.mkdir(outputDir, { recursive: true });
        
        // Get the documentation generator instance
        const generator = DocumentationGenerator.getInstance();
        
        // Initialize the generator
        await generator.initialize();
        spinner.succeed('Documentation generator initialized');
        
        // Generate documentation
        if ((await fs.stat(inputPath)).isFile()) {
          // Single file
          spinner.text = `Generating documentation for file: ${path.basename(inputPath)}`;
          spinner.start();
          
          const sections = await generator.generateDocumentation(inputPath);
          
          // Save to file
          const outputPath = path.join(outputDir, `${path.basename(inputPath, path.extname(inputPath))}.md`);
          const markdown = sections.map(section => section.content).join('\n\n---\n\n');
          await fs.writeFile(outputPath, markdown);
          
          spinner.succeed(`Documentation saved to ${outputPath}`);
        } else {
          // Directory
          spinner.text = 'Analyzing project structure...';
          spinner.start();
          
          const results = await generator.generateProjectDocumentation(inputPath, {
            extensions,
            excludeDirs,
            maxFiles
          });
          
          const fileCount = Object.keys(results).length;
          spinner.succeed(`Generated documentation for ${fileCount} files`);
          
          // Save all documentation to files
          for (const [filePath, sections] of Object.entries(results)) {
            const fileName = path.basename(filePath, path.extname(filePath));
            const outputPath = path.join(outputDir, `${fileName}.md`);
            const markdown = sections.map(section => section.content).join('\n\n---\n\n');
            await fs.writeFile(outputPath, markdown);
            console.log(chalk.green(`✓ Saved documentation for ${fileName}`));
          }
          
          // Generate index file
          const indexPath = path.join(outputDir, 'index.md');
          const indexContent = `# Project Documentation\n\n## Files\n\n${Object.keys(results)
            .map(filePath => `- [${path.basename(filePath)}](${path.basename(filePath, path.extname(filePath))}.md)`)
            .join('\n')}\n`;
          
          await fs.writeFile(indexPath, indexContent);
          console.log(chalk.green(`✓ Generated index file at ${indexPath}`));
        }
        
        console.log(chalk.bold.green('\nDocumentation generation completed successfully!'));
      } catch (error) {
        console.error(chalk.red('Error generating documentation:'), error);
        process.exit(1);
      }
    });
  
  program.parse();
}

// Run the program
main().catch(error => {
  console.error(chalk.red('Unhandled error:'), error);
  process.exit(1);
});

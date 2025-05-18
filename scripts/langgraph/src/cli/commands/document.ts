import { Command } from 'commander';
import { resolve } from 'path';
import { promises as fs } from 'fs';
import chalk from 'chalk';

// Using path aliases for cleaner imports
import { DocumentationGenerator } from '@core/documentationGenerator';
import { ConfigLoader } from '@utils/configLoader';
import { DocumentationConfig } from '@models/types';

import dotenv from 'dotenv';

dotenv.config();

// Handle graceful exit on Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\nProcess interrupted. Exiting gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nProcess terminated. Exiting gracefully...');
  process.exit(0);
});

export const documentCommand = new Command('document')
  .description('Generate documentation for code files using an AI agent')
  .argument('<input>', 'Input file or directory')
  .option('-o, --output <path>', 'Output directory', './docs')
  .option('-i, --include <patterns...>', 'File patterns to include (e.g., "*.ts,*.js")')
  .option('-e, --exclude <patterns...>', 'File patterns to exclude (e.g., "node_modules,dist")')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-m, --max-files <number>', 'Maximum number of files to process', '50')
  .option('-f, --force', 'Force overwrite of existing files')
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (input: string, options: {
    output: string;
    include?: string[];
    exclude?: string[];
    verbose?: boolean;
    maxFiles?: string;
    force?: boolean;
    config?: string;
  }) => {
    // Create logger function based on verbosity setting
    const log = (message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      if (options.verbose || level === 'error' || level === 'success') {
        const colorMap = {
          info: chalk.blue,
          success: chalk.green,
          warning: chalk.yellow,
          error: chalk.red
        };
        console.log(colorMap[level](message));
      }
    };

    try {
      log('Starting agent-driven documentation generation...', 'info');

      // Initialize services
      const documentationGenerator = DocumentationGenerator.getInstance();
      const configLoader = ConfigLoader.getInstance();

      // Load or create configuration if config option is provided
      let documentationConfig: DocumentationConfig;
      let inputPath: string;
      let outputPath: string;

      if (options.config) {
        const configPath = resolve(options.config);
        log(`Loading configuration from ${configPath}`, 'info');
        try {
          // Load configuration from file
          documentationConfig = await configLoader.loadConfig(configPath);
          log('Configuration loaded successfully', 'success');

          // Override configuration with command line options if provided
          if (options.output) documentationConfig.output = options.output;
          if (options.include) documentationConfig.fileConfig.include = options.include;
          if (options.exclude) documentationConfig.fileConfig.exclude = options.exclude;

          inputPath = resolve(documentationConfig.input);
          outputPath = resolve(documentationConfig.output);
        } catch (configError) {
          log(`Error loading configuration: ${configError instanceof Error ? configError.message : String(configError)}`, 'error');
          // Create default configuration if loading fails
          documentationConfig = configLoader.createDefaultConfig(input, options.output);
          inputPath = resolve(input);
          outputPath = resolve(options.output);
        }
      } else {
        // Use command line options directly
        inputPath = resolve(input);
        outputPath = resolve(options.output);
      }

      // Check if input path exists
      try {
        await fs.access(inputPath);
      } catch {
        throw new Error(`Input path does not exist: ${inputPath}`);
      }

      // Create output directory if it doesn't exist
      await fs.mkdir(outputPath, { recursive: true });

      log(`Generating documentation for: ${chalk.green(inputPath)}`, 'info');
      log(`Output directory: ${chalk.green(outputPath)}`, 'info');

      // Parse include/exclude patterns
      const extensions = options.include || ['.ts', '.js', '.tsx', '.jsx'];
      const excludeDirs = options.exclude || ['node_modules', 'dist', 'build', '.git'];
      const maxFiles = parseInt(options.maxFiles || '50', 10);

      // Initialize the documentation generator
      await documentationGenerator.initialize();

      log('AI agent initialized successfully', 'success');
      log('Starting project analysis and documentation generation...', 'info');

      // Generate documentation for the entire project using the agent-driven approach
      await documentationGenerator.generateProjectDocumentation(
        inputPath,
        outputPath,
        {
          extensions,
          excludeDirs,
          maxFiles
        }
      );

      log('Documentation generation completed successfully!', 'success');
      log(`Documentation saved to: ${chalk.green(outputPath)}`, 'success');
      process.exit(0);
    } catch (error: unknown) {
      log(`Error generating documentation: ${error instanceof Error ? error.message : String(error)}`, 'error');
      process.exit(1);
    }
  });

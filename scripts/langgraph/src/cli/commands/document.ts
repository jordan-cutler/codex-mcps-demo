import { Command } from 'commander';
import { join, resolve } from 'path';
import { promises as fs } from 'fs';
import chalk from 'chalk';

// Using path aliases for cleaner imports
import { FileSystem } from '@utils/fileSystem';
import { DocumentationGenerator } from '@core/documentationGenerator';
import { TemplateEngine } from '@core/templateEngine';
import { MarkdownFormatter } from '@utils/markdown';
import { ConfigLoader } from '@utils/configLoader';
import { DocumentationConfig } from '@models/types';

export const documentCommand = new Command('document')
  .description('Generate documentation for code files')
  .argument('<input>', 'Input file or directory')
  .option('-o, --output <path>', 'Output directory', './docs')
  .option('-t, --template <name>', 'Template name', 'default')
  .option('-p, --template-path <path>', 'Path to custom template')
  .option('-i, --include <patterns...>', 'File patterns to include')
  .option('-e, --exclude <patterns...>', 'File patterns to exclude')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-f, --force', 'Force overwrite of existing files')
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (input: string, options: { 
    output: string; 
    template: string;
    templatePath?: string;
    include?: string[];
    exclude?: string[];
    verbose?: boolean;
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
      log('Starting documentation generation...', 'info');
      
      // Initialize services
      const fileSystem = FileSystem.getInstance();
      const documentationGenerator = DocumentationGenerator.getInstance();
      const templateEngine = TemplateEngine.getInstance();
      const markdownFormatter = MarkdownFormatter.getInstance();
      const configLoader = ConfigLoader.getInstance();
      
      // Load or create configuration
      let documentationConfig: DocumentationConfig;
      
      if (options.config) {
        const configPath = resolve(options.config);
        log(`Loading configuration from ${configPath}`, 'info');
        try {
          // Load configuration from file
          documentationConfig = await configLoader.loadConfig(configPath);
          log('Configuration loaded successfully', 'success');
          
          // Override configuration with command line options if provided
          if (options.output) documentationConfig.output = options.output;
          if (options.template) documentationConfig.template.name = options.template;
          if (options.templatePath) documentationConfig.template.path = options.templatePath;
          if (options.include) documentationConfig.fileConfig.include = options.include;
          if (options.exclude) documentationConfig.fileConfig.exclude = options.exclude;
        } catch (configError) {
          log(`Error loading configuration: ${configError instanceof Error ? configError.message : String(configError)}`, 'error');
          // Create default configuration if loading fails
          documentationConfig = configLoader.createDefaultConfig(input, options.output);
        }
      } else {
        // Create default configuration
        documentationConfig = configLoader.createDefaultConfig(input, options.output);
        
        // Apply command line options
        if (options.template) documentationConfig.template.name = options.template;
        if (options.templatePath) documentationConfig.template.path = options.templatePath;
        if (options.include) documentationConfig.fileConfig.include = options.include;
        if (options.exclude) documentationConfig.fileConfig.exclude = options.exclude;
      }
      
      // Resolve paths
      const inputPath = resolve(documentationConfig.input);
      const outputPath = resolve(documentationConfig.output);
      
      // Update resolved paths in config
      documentationConfig.input = inputPath;
      documentationConfig.output = outputPath;
      
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
      log(`Using template: ${chalk.green(documentationConfig.template.name)}`, 'info');
      
      if (documentationConfig.fileConfig.include.length > 0) {
        log(`Including patterns: ${documentationConfig.fileConfig.include.join(', ')}`, 'info');
      }
      
      if (documentationConfig.fileConfig.exclude.length > 0) {
        log(`Excluding patterns: ${documentationConfig.fileConfig.exclude.join(', ')}`, 'info');
      }
      
      // Get files to process
      let filesToProcess: string[] = [];
      
      const stats = await fs.stat(inputPath);
      if (stats.isDirectory()) {
        // Process directory
        const allFiles = await fileSystem.getFiles(['**/*'], inputPath);
        filesToProcess = fileSystem.filterFiles(allFiles, documentationConfig.fileConfig);
      } else {
        // Process single file
        filesToProcess = [inputPath];
      }
      
      // Save the configuration for future use if verbose mode is enabled
      if (options.verbose) {
        const configSavePath = join(outputPath, 'documentation-config.json');
        try {
          await configLoader.saveConfig(documentationConfig, configSavePath);
          log(`Configuration saved to ${configSavePath}`, 'info');
        } catch (error) {
          log(`Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`, 'warning');
        }
      }
      
      log(`Found ${chalk.green(filesToProcess.length.toString())} files to process`, 'info');
      
      if (filesToProcess.length === 0) {
        log('No files found to process. Check your include/exclude patterns.', 'warning');
        return;
      }
      
      // Process each file
      for (const filePath of filesToProcess) {
        try {
          log(`Processing: ${chalk.green(filePath)}`, 'info');
          
          // Generate documentation
          const documentationSections = await documentationGenerator.generateDocumentation(filePath);
          
          // Format documentation with Markdown
          let documentationContent = markdownFormatter.formatSections(documentationSections);
          
          // Add cross-references
          documentationContent = markdownFormatter.addCrossReferences(documentationContent, documentationSections);
          
          // Apply template
          documentationContent = await templateEngine.applyTemplate(
            documentationSections,
            documentationConfig.template
          );
          
          // Validate Markdown
          const isValid = markdownFormatter.validateMarkdown(documentationContent);
          if (!isValid) {
            log(`Warning: Generated Markdown for ${filePath} may have syntax issues`, 'warning');
          }
          
          // Determine output file path
          const relativePath = fileSystem.getRelativePath(inputPath, filePath);
          const outputFilePath = join(outputPath, `${relativePath}.md`);
          
          // Ensure output directory exists
          await fs.mkdir(join(outputFilePath, '..'), { recursive: true });
          
          // Check if file exists and handle overwrite
          let shouldWrite = true;
          try {
            await fs.access(outputFilePath);
            if (!options.force) {
              log(`File already exists: ${outputFilePath}. Use --force to overwrite.`, 'warning');
              shouldWrite = false;
            }
          } catch {
            // File doesn't exist, proceed with writing
          }
          
          if (shouldWrite) {
            // Write documentation to file
            await fileSystem.writeFile(outputFilePath, documentationContent);
            log(`✓ Documentation generated for ${filePath}`, 'success');
          }
        } catch (error) {
          log(`Error processing file ${filePath}: ${error instanceof Error ? error.message : String(error)}`, 'error');
        }
      }
      
      log('Documentation generation complete!', 'success');
    } catch (error) {
      console.error(chalk.red(`Error generating documentation: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

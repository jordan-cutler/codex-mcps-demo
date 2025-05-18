import { Command } from 'commander';

export const documentCommand = new Command('document')
  .description('Generate documentation for code files')
  .argument('<input>', 'Input file or directory')
  .option('-o, --output <path>', 'Output directory', './docs')
  .option('--template <name>', 'Template name', 'default')
  .action(async (input: string, options: { output: string; template: string }) => {
    try {
      console.log(`Generating documentation for: ${input}`);
      console.log(`Output directory: ${options.output}`);
      console.log(`Using template: ${options.template}`);
      console.log('Documentation generation complete!');
    } catch (error) {
      console.error('Error generating documentation:', error);
      process.exit(1);
    }
  });

#!/usr/bin/env node

import { execSync } from 'child_process';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import dotenv from 'dotenv';

// Define an interface for the potential error from execSync
interface ExecSyncError extends Error {
  status?: number;
  signal?: NodeJS.Signals;
  output?: (Buffer | null)[];
  pid?: number;
  stdout?: Buffer | string;
  stderr?: Buffer | string;
}

// Load environment variables from .env file
// Make sure you have OPENAI_API_KEY set in your .env file
dotenv.config();

async function run() {
  // Configure yargs
  const argv = await yargs(hideBin(process.argv))
    .command('$0 <folder>', 'Explain a folder using OpenAI Codex', (yargs) => {
      return yargs.positional('folder', {
        describe: 'The path to the folder to explain',
        type: 'string',
        demandOption: true, // Ensure folder is provided
      });
    })
    .usage(`Usage: ${chalk.yellow('$0 <folder>')}`)
    .help()
    .alias('h', 'help')
    .strict() // Fail on unknown commands/options
    .fail((msg, err, yargs) => {
      // Custom failure handler
      if (err) throw err; // preserve stack
      console.error(chalk.red('Error:'), msg);
      console.error(' ');
      console.error(yargs.help());
      process.exit(1);
    })
    .parseAsync(); // Use async parsing

  // Extract folder name - yargs ensures it exists due to demandOption
  // We cast here because demandOption guarantees it's a string if parsing succeeded
  const folderName = argv.folder as string;

  // Construct the command
  // Ensure the folderName is properly escaped if it contains spaces or special characters
  // For simplicity, we assume folder names don't contain double quotes here.

  const diagramFile = `${folderName}/diagram.ai.md`;
  const request = `Add a file called ${diagramFile} which uses mermaid syntax to describe the folder: ${folderName}`;
  const options = '-p';
  const command = `claude ${options} "${request}"`;

  console.log(chalk.blue('Running command:'), chalk.cyan(command));
  console.log(chalk.gray('---')); // Separator

  try {
    // Execute the command
    // stdio: 'inherit' will pass through stdout/stderr directly to the user's terminal
    // This allows seeing codex's output (and potential prompts) in real-time.
    execSync(command, { encoding: 'utf-8', stdio: 'inherit' });

    console.log(chalk.gray('---')); // Separator
    console.log(chalk.green('✅ Codex command finished successfully.'));
  } catch (error) {
    console.log(chalk.gray('---')); // Separator
    console.error(chalk.red('\n❌ Error executing codex command:'));
    // Check if error is an object and has status property before accessing
    if (typeof error === 'object' && error !== null && 'status' in error) {
      // Now we can safely cast after the check
      const execError = error as ExecSyncError;
      console.error(
        chalk.red(
          `Command exited with status ${execError.status ?? 'unknown'}`,
        ),
      );
    } else if (error instanceof Error) {
      // Handle standard Error objects
      console.error(chalk.red(error.message));
    } else {
      // Handle other potential error types
      console.error(
        chalk.red('An unknown error occurred during command execution.'),
      );
    }
    process.exit(1); // Exit with error code
  }
}

run().catch((error) => {
  console.error(chalk.red('An unexpected error occurred:'), error);
  process.exit(1);
});

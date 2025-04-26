#!/usr/bin/env node

import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import dotenv from 'dotenv';

// Load environment variables from .env file
// Make sure you have ANTHROPIC_API_KEY set in your .env file
dotenv.config();

const exec = promisify(execCallback);

const PROMPT_DIR = `prompts`;
const OUTPUT_FILE = 'diagram.ai.md';

async function run() {
  const argv = await yargs(hideBin(process.argv))
    .command(
      '$0 <folder>',
      'Generate a diagram for a folder using Claude',
      (yargs) => {
        return yargs.positional('folder', {
          describe: 'The path to the folder to generate a diagram for',
          type: 'string',
          demandOption: true,
        });
      },
    )
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
  const inputFolderName = argv.folder as string;
  const outputDir = `outputs/${inputFolderName}`;

  try {
    await exec(`mkdir -p ${outputDir}`);

    const { stdout: firstPromptOutput, stderr: firstPromptError } = await exec(
      `cat ${PROMPT_DIR}/firstPrompt.txt | claude -p "Do this for ${inputFolderName}"`,
    );

    if (firstPromptError) {
      throw new Error(firstPromptError);
    }
    console.log(firstPromptOutput);
    await exec(`echo "${firstPromptOutput}" > ${outputDir}/first.txt`);
    console.log('--------------------------------');

    const { stdout: secondPromptOutput, stderr: secondPromptError } =
      await exec(
        `cat ${outputDir}/first.txt | claude -p "$(cat ${PROMPT_DIR}/secondPrompt.txt)"`,
      );

    if (secondPromptError) {
      throw new Error(secondPromptError);
    }

    console.log(secondPromptOutput);
    await exec(`echo "${secondPromptOutput}" > ${outputDir}/second.txt`);
    console.log('--------------------------------');

    const { stdout: thirdPromptOutput, stderr: thirdPromptError } = await exec(
      `cat ${outputDir}/second.txt | claude -p "$(cat ${PROMPT_DIR}/thirdPrompt.txt)"`,
    );

    if (thirdPromptError) {
      throw new Error(thirdPromptError);
    }

    console.log(thirdPromptOutput);
    await exec(`echo "${thirdPromptOutput}" > ${outputDir}/third.txt`);
    await exec(
      `echo "${thirdPromptOutput}" > ${inputFolderName}/${OUTPUT_FILE}`,
    );

    console.log(chalk.green('✅ Claude command finished successfully.'));
  } catch (error) {
    console.error(chalk.red('\n❌ Error executing claude command:'));
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
    } else {
      console.error(
        chalk.red('An unknown error occurred during command execution.'),
      );
    }
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(chalk.red('An unexpected error occurred:'), error);
  process.exit(1);
});

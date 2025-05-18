#!/usr/bin/env node
import { Command } from 'commander';
import { documentCommand } from './cli/commands/document';

const program = new Command();

// Add document command as default
program.addCommand(documentCommand, { isDefault: true });

// Parse arguments
program.parse(process.argv);


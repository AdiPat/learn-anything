#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import boxen from 'boxen';
import gradient from 'gradient-string';
import { VERSION } from '@/core/lean.js';
import { ActionOptions } from '@/types/index.js';
import { setupActionCommands } from '@/actions.js';
import { cliActionMap } from '@/actions.js';

dotenv.config();

export function getCLIProgram(): Command {
  const program = new Command();
  // Main program configuration
  program
    .name('lean')
    .version(VERSION)
    .description('')
    .option('--topic <topic>', 'Pass additional (optional) topic.')
    .option('--env <file>', 'Pass a custom env file, overrides variables in config.')
    .option('--config <file>', 'Pass a custom config, else uses ~/.lean/config.json.')
    .option('--setup-config', 'Sets up the config via interactive mode.')
    .option('--input <file>', 'Use input file directly when setting up config.')
    .option('--profile <name>', 'Use a specific profile (includes model and temperature).')
    .option('--creativity <level>', 'How creative? (0.0-2.0).', parseFloat)
    .option('--interactive', 'Interactive mode.')
    .option('--output <file>', 'Dump file to output.')
    // Global action shortcuts
    .option('--ask <query>', 'Single-shot question answering.')
    .option('--analyze <query>', 'Multi-step reasoning and analysis.')
    .option('--explain <topic>', 'Clear explanations with examples.')
    .option('--teach <topic>', 'Chapter-style distillation of a topic.')
    .option('--chat [topic]', 'Conversational mode with optional context.');

  // Aesthetic help banner and examples
  const title = gradient.cristal('🧠 LEAN: Learn Anything.');
  const line1 = chalk.white('Crafted with finesse by Aditya Patange (AdiPat).');
  const line2 = chalk.gray(
    '© Aditya Patange. All rights reserved. "LEAN" is a trademark of Aditya Patange.'
  );
  const line3 = chalk.gray('For queries, contact support@agnilearn.com.');
  const banner = boxen(`${title}\n${line1}\n${line2}\n${line3}`, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    backgroundColor: '#0a0a0a',
  });
  program.addHelpText('before', `${banner}\n`);

  const examples = [
    `${chalk.cyan('Ask')}        ${chalk.white('lean --ask')} ${chalk.gray('"What is AI?"')}.`,
    `${chalk.cyan('Explain')}    ${chalk.white('lean --explain')} ${chalk.gray('"Black holes"')}.`,
    `${chalk.cyan('Teach')}      ${chalk.white('lean --teach')} ${chalk.gray('"Linear algebra"')}.`,
    `${chalk.cyan('Analyze')}    ${chalk.white('lean --analyze')} ${chalk.gray('"Impact of quantum computing"')}.`,
    `${chalk.cyan('Chat')}       ${chalk.white('lean --chat')} ${chalk.gray('"Deep learning"')}.`,
    `${chalk.cyan('Setup')}      ${chalk.white('lean --setup-config')} ${chalk.gray('# Configure LEAN interactively')}.`,
    `${chalk.cyan('Output')}     ${chalk.white('lean --ask')} ${chalk.gray('"What is AI?"')} ${chalk.white('--output')} ${chalk.gray('notes/ai.md')}.`,
  ].join('\n');

  const paramsPrimary = [
    `${chalk.cyan('--ask <query>')} – Single-shot question answering.`,
    `${chalk.cyan('--analyze <query>')} – Multi-step reasoning and analysis.`,
    `${chalk.cyan('--explain <topic>')} – Clear explanations with examples.`,
    `${chalk.cyan('--teach <topic>')} – Chapter-style distillation of a topic.`,
    `${chalk.cyan('--chat [topic]')} – Conversational mode with optional context.`,
    `${chalk.cyan('--setup-config')} – Interactive configuration setup.`,
  ].join('\n');

  const paramsSecondary = [
    `${chalk.cyan('--output <file>')} – Write formatted Markdown output.`,
    `${chalk.cyan('--topic <topic>')} – Additional context for your prompt.`,
    `${chalk.cyan('--profile <name>')} – Use a saved profile (model, temperature).`,
    `${chalk.cyan('--creativity <0.0-2.0>')} – Adjust model creativity.`,
    `${chalk.cyan('--env <file>')}, ${chalk.cyan('--config <file>')}, ${chalk.cyan('--input <file>')} – Configuration files.`,
    `${chalk.cyan('--interactive')} – Enable interactive execution.`,
    `${chalk.cyan('--setup-config')} – Sets up config via interactive mode.`,
  ].join('\n');

  const paramsBox = boxen(
    `${chalk.bold('Commands')}\n\n${chalk.white('Main actions:')}\n${paramsPrimary}\n\n${chalk.white('Global options:')}\n${paramsSecondary}`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'single',
      borderColor: 'gray',
      backgroundColor: '#0a0a0a',
    }
  );

  const examplesBox = boxen(
    `${chalk.bold('Examples')}
 ${examples}
 
 ${chalk.gray('Tip: You can use global shortcuts like --ask, --chat, etc.')}\n`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'single',
      borderColor: 'gray',
      backgroundColor: '#0a0a0a',
    }
  );
  program.addHelpText('after', `\n${paramsBox}\n${examplesBox}`);

  setupActionCommands(program, cliActionMap);

  // Default action when no command is specified (starts chat)
  program.action(async (options: ActionOptions) => {
    await (cliActionMap.commands.default!.action as (opts: ActionOptions) => Promise<void>)(
      options
    );
  });

  // Error handling
  program.exitOverride();

  return program;
}

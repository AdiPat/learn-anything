#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import { VERSION, executeLeanAction } from '@/index.js';
import { setupInteractiveConfig } from '@/utils/config.js';
import { ProcessedOptions, ActionType, ActionOptions } from '@/types/index.js';

dotenv.config();

const program = new Command();

// Utility function to process action commands
async function processAction(
  action: ActionType,
  query: string,
  options: ActionOptions
): Promise<void> {
  const processedOptions: ProcessedOptions = {
    action,
    query,
    ...options,
  };

  await executeLeanAction(processedOptions);
}

// Main program configuration
program
  .name('lean')
  .version(VERSION)
  .description('Learn Anything - AI-powered learning assistant')
  .option('--topic <topic>', 'Pass additional (optional) topic')
  .option('--env <file>', 'Pass a custom env file, overrides variables in config')
  .option('--config <file>', 'Pass a custom config, else uses ~/.lean/config.json')
  .option('--setup-config', 'Sets up the config via interactive mode')
  .option('--input <file>', 'Use input file directly when setting up config')
  .option('--profile <name>', 'Use a specific profile (includes model and temperature)')
  .option('--creativity <level>', 'How creative? (0.0-2.0)', parseFloat)
  .option('--interactive', 'Interactive mode')
  .option('--output <file>', 'Dump file to output');

// Setup config command
program
  .command('setup')
  .description('Setup Lean configuration interactively')
  .action(async () => {
    await setupInteractiveConfig();
  });

// Analyze command
program
  .command('analyze <query>')
  .description('Perform multi-step reasoning and analysis')
  .action(async (query: string, options: ActionOptions) => {
    await processAction('analyze', query, options);
  });

// Ask command
program
  .command('ask <query>')
  .description('Simply answer the question like an "Answer Engine"')
  .action(async (query: string, options: ActionOptions) => {
    await processAction('ask', query, options);
  });

// Explain command
program
  .command('explain <topic>')
  .description('Explain and improve understanding with engaging explanations')
  .action(async (topic: string, options: ActionOptions) => {
    await processAction('explain', topic, options);
  });

// Teach command
program
  .command('teach <topic>')
  .description('Topic-wise distillation like a chapter of a book')
  .action(async (topic: string, options: ActionOptions) => {
    await processAction('teach', topic, options);
  });

// Chat command
program
  .command('chat [topic]')
  .description('Start conversational mode')
  .action(async (topic: string | undefined, options: ActionOptions) => {
    const query = topic || "Hello! I'd like to start a conversation.";
    await processAction('chat', query, options);
  });

// Default action when no command is specified (starts chat)
program.action(async (options: ActionOptions) => {
  if (options.setupConfig) {
    await setupInteractiveConfig();
    return;
  }

  // Default to chat mode
  await processAction('chat', "Hello! I'd like to start a conversation.", options);
});

// Global option shortcuts
program
  .option('--analyze <query>', 'Shortcut for analyze command')
  .option('--ask <query>', 'Shortcut for ask command')
  .option('--explain <topic>', 'Shortcut for explain command')
  .option('--teach <topic>', 'Shortcut for teach command')
  .option('--chat [topic]', 'Shortcut for chat command');

// Handle global shortcuts
program.hook('preAction', async (thisCommand, _actionCommand) => {
  const opts = thisCommand.opts();

  if (opts.setupConfig) {
    await setupInteractiveConfig();
    process.exit(0);
  }

  // Handle shortcut options
  if (opts.analyze) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await processAction('analyze', opts.analyze, opts);
    process.exit(0);
  }

  if (opts.ask) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await processAction('ask', opts.ask, opts);
    process.exit(0);
  }

  if (opts.explain) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await processAction('explain', opts.explain, opts);
    process.exit(0);
  }

  if (opts.teach) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await processAction('teach', opts.teach, opts);
    process.exit(0);
  }

  if (opts.chat !== undefined) {
    const topic =
      typeof opts.chat === 'string' ? opts.chat : "Hello! I'd like to start a conversation.";
    await processAction('chat', topic, opts);
    process.exit(0);
  }
});

// Error handling
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error) {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

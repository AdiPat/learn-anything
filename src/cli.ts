#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import { VERSION, executeLeanAction } from '@/index.js';
import { setupInteractiveConfig } from '@/utils/config.js';
import { ProcessedOptions, ActionType, ActionOptions } from '@/types/index.js';

dotenv.config();

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

interface CLIActionItem {
  description: string;
  actionId: string;
  defaultQuery?: string;
  action?: (...args: any[]) => Promise<void>;
}

type CLIActionMap = {
  commands: Record<string, CLIActionItem>;
};

const cliActionMap: CLIActionMap = {
  commands: {
    setupConfig: {
      description: 'Setup Lean configuration interactively.',
      actionId: 'setupConfig',
      action: async () => {
        await setupInteractiveConfig();
      },
    },
    setup: {
      description: 'Setup Lean configuration interactively.',
      actionId: 'setup',
      action: async () => {
        await setupInteractiveConfig();
      },
    },
    analyze: {
      description: 'Perform multi-step reasoning and analysis.',
      actionId: 'analyze',
    },
    ask: {
      description: 'Simply answer the question like an "Answer Engine".',
      actionId: 'ask',
    },
    explain: {
      description: 'Explain and improve understanding with engaging explanations.',
      actionId: 'explain',
    },
    teach: {
      description: 'Topic-wise distillation like a chapter of a book.',
      actionId: 'teach',
    },
    chat: {
      description: 'Start conversational mode.',
      actionId: 'chat',
      defaultQuery: "Hello! I'd like to start a conversation.",
    },
    default: {
      description: 'Default action.',
      actionId: 'default',
      action: async (options: ActionOptions) => {
        if (options.setupConfig) {
          await setupInteractiveConfig();
          return;
        }

        // Default to chat mode
        await processAction('chat', "Hello! I'd like to start a conversation.", options);
      },
    },
  },
};

function setupOneActionCommand(program: Command, action: CLIActionItem) {
  const command = program.command(action.actionId).description(action.description);

  if (action.action) {
    command.action(action.action);
  } else {
    command.action(async (...args: any[]) => {
      const query = args[0] ?? action.defaultQuery;
      const options = args[1];

      await processAction(action.actionId as ActionType, query, options);
    });
  }
}

function setupActionCommands(program: Command, actionMap: CLIActionMap) {
  const actionCommands = Object.values(actionMap.commands);
  for (const action of actionCommands) {
    if (action.actionId === 'default') {
      continue;
    }
    setupOneActionCommand(program, action);
  }

  // setup default action command at the end
  setupOneActionCommand(program, actionMap.commands.default!);
}

function getCLIProgram(): Command {
  const program = new Command();
  // Main program configuration
  program
    .name('lean')
    .version(VERSION)
    .description("LEAN: 'Learn Anything'\n\nCreated by Aditya Patange (AdiPat).")
    .option('--topic <topic>', 'Pass additional (optional) topic.')
    .option('--env <file>', 'Pass a custom env file, overrides variables in config.')
    .option('--config <file>', 'Pass a custom config, else uses ~/.lean/config.json.')
    .option('--setup-config', 'Sets up the config via interactive mode.')
    .option('--input <file>', 'Use input file directly when setting up config.')
    .option('--profile <name>', 'Use a specific profile (includes model and temperature).')
    .option('--creativity <level>', 'How creative? (0.0-2.0).', parseFloat)
    .option('--interactive', 'Interactive mode.')
    .option('--output <file>', 'Dump file to output.');

  setupActionCommands(program, cliActionMap);

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

  return program;
}

async function main() {
  try {
    const program = getCLIProgram();
    await program.parseAsync(process.argv);
  } catch (error) {
    const err = error as any;
    // Commander throws on help/version when exitOverride is enabled
    if (err && (err.code === 'commander.helpDisplayed' || err.code === 'commander.version')) {
      process.exit(0);
      return;
    }
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      process.exit(typeof err?.exitCode === 'number' ? err.exitCode : 1);
    } else {
      process.exit(1);
    }
  }
}

main();

#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import boxen from 'boxen';
import gradient from 'gradient-string';
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
  args?: string; // e.g., '<query>' or '[topic]'
  aliases?: string[];
  emoji?: string;
  action?: (...args: any[]) => Promise<void>;
}

type CLIActionMap = {
  commands: Record<string, CLIActionItem>;
};

const cliActionMap: CLIActionMap = {
  commands: {
    setup: {
      description: '⚙️  Set up Lean configuration interactively.',
      actionId: 'setup',
      emoji: '⚙️',
      aliases: ['init'],
      action: async () => {
        await setupInteractiveConfig();
      },
    },
    analyze: {
      description: 'Perform multi-step reasoning and analysis.',
      actionId: 'analyze',
      args: '<query>',
      emoji: '🔍',
    },
    ask: {
      description: 'Simply answer the question like an "Answer Engine".',
      actionId: 'ask',
      args: '<query>',
      emoji: '💭',
    },
    explain: {
      description: 'Explain and improve understanding with engaging explanations.',
      actionId: 'explain',
      args: '<topic>',
      emoji: '📚',
    },
    teach: {
      description: 'Topic-wise distillation like a chapter of a book.',
      actionId: 'teach',
      args: '<topic>',
      emoji: '🎓',
    },
    chat: {
      description: 'Start conversational mode.',
      actionId: 'chat',
      args: '[topic]',
      defaultQuery: "Hello! I'd like to start a conversation.",
      emoji: '💬',
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
  const idWithArgs = action.args ? `${action.actionId} ${action.args}` : action.actionId;
  const title = action.emoji ? `${action.emoji} ${action.description}` : action.description;
  const command = program.command(idWithArgs).description(title);

  if (action.aliases && action.aliases.length) {
    for (const al of action.aliases) command.alias(al);
  }

  if (action.action) {
    command.action(action.action);
  } else {
    // Commander passes (arg1, arg2, ..., options, command)
    if (action.actionId === 'chat') {
      command.action(async (topic: string | undefined, options: ActionOptions) => {
        const query = topic ?? action.defaultQuery ?? '';
        await processAction('chat', query, options);
      });
    } else {
      command.action(async (query: string, options: ActionOptions) => {
        await processAction(action.actionId as ActionType, query, options);
      });
    }
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
}

function getCLIProgram(): Command {
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
    .option('--output <file>', 'Dump file to output.');

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
    `${chalk.cyan('Ask')}        ${chalk.white('lean ask')} ${chalk.gray('"What is AI?"')}.`,
    `${chalk.cyan('Explain')}    ${chalk.white('lean explain')} ${chalk.gray('"Black holes"')}.`,
    `${chalk.cyan('Teach')}      ${chalk.white('lean teach')} ${chalk.gray('"Linear algebra"')}.`,
    `${chalk.cyan('Analyze')}    ${chalk.white('lean analyze')} ${chalk.gray('"Impact of quantum computing"')}.`,
    `${chalk.cyan('Chat')}       ${chalk.white('lean chat')} ${chalk.gray('"Deep learning"')}.`,
    `${chalk.cyan('Output')}     ${chalk.white('lean ask')} ${chalk.gray('"What is AI?"')} ${chalk.white('--output')} ${chalk.gray('notes/ai.md')}.`,
  ].join('\n');

  const paramsPrimary = [
    `${chalk.cyan('ask <query>')} – Single-shot question answering.`,
    `${chalk.cyan('analyze <query>')} – Multi-step reasoning and analysis.`,
    `${chalk.cyan('explain <topic>')} – Clear explanations with examples.`,
    `${chalk.cyan('teach <topic>')} – Chapter-style distillation of a topic.`,
    `${chalk.cyan('chat [topic]')} – Conversational mode with optional context.`,
    `${chalk.cyan('setup')} – Interactive configuration setup.`,
  ].join('\n');

  const paramsSecondary = [
    `${chalk.cyan('--output <file>')} – Write formatted Markdown output.`,
    `${chalk.cyan('--topic <topic>')} – Additional context for your prompt.`,
    `${chalk.cyan('--profile <name>')} – Use a saved profile (model, temperature).`,
    `${chalk.cyan('--creativity <0.0-2.0>')} – Adjust model creativity.`,
    `${chalk.cyan('--env <file>')}, ${chalk.cyan('--config <file>')}, ${chalk.cyan('--input <file>')} – Configuration files.`,
    `${chalk.cyan('--interactive')} – Enable interactive execution.`,
  ].join('\n');

  const paramsBox = boxen(
    `${chalk.bold('Parameters')}\n\n${chalk.white('Primary (first-order):')}\n${paramsPrimary}\n\n${chalk.white('Secondary (second-order):')}\n${paramsSecondary}`,
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
 
 ${chalk.gray('Tip: You can also use global shortcuts like --ask, --chat, etc.')}\n`,
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

  // Global option shortcuts
  program
    .option('--analyze <query>', 'Shortcut for analyze command.')
    .option('--ask <query>', 'Shortcut for ask command.')
    .option('--explain <topic>', 'Shortcut for explain command.')
    .option('--teach <topic>', 'Shortcut for teach command.')
    .option('--chat [topic]', 'Shortcut for chat command.');

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

void main();

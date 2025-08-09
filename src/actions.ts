import { ActionType, ActionOptions, ProcessedOptions } from '@/types/index.js';
import { executeLeanAction } from '@/core/lean.js';
import { setupInteractiveConfig } from '@/utils/config.js';
import { Command } from 'commander';

export interface CLIActionItem {
  description: string;
  actionId: string;
  defaultQuery?: string;
  args?: string; // e.g., '<query>' or '[topic]'
  aliases?: string[];
  emoji?: string;
  action?: (...args: any[]) => Promise<void>;
}

export type CLIActionMap = {
  commands: Record<string, CLIActionItem>;
};

export const cliActionMap: CLIActionMap = {
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

        // Dynamically check for global shortcut options by looping through all actions
        // This avoids duplicating action logic and scales automatically when new actions are added
        for (const [actionId, actionConfig] of Object.entries(cliActionMap.commands)) {
          if (actionId === 'default') continue;

          // Check if this action's corresponding option (--actionId) is set
          const optionValue = (options as any)[actionId];
          if (optionValue !== undefined) {
            // Handle chat's special case where it can be boolean or string
            if (actionId === 'chat') {
              const topic =
                typeof optionValue === 'string' ? optionValue : (actionConfig.defaultQuery ?? '');
              await processAction(actionId as ActionType, topic, options);
              return;
            } else {
              // For other actions, the option value is the query/topic
              await processAction(actionId as ActionType, optionValue, options);
              return;
            }
          }
        }

        // Default to chat mode
        await processAction('chat', "Hello! I'd like to start a conversation.", options);
      },
    },
  },
};

// Utility function to process action commands.
export async function processAction(
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

// Utility function to setup one action command.
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

// Utility function to setup multiple action commands.
export function setupActionCommands(program: Command, actionMap: CLIActionMap) {
  const actionCommands = Object.values(actionMap.commands);
  for (const action of actionCommands) {
    if (action.actionId === 'default') {
      continue;
    }
    setupOneActionCommand(program, action);
  }
}

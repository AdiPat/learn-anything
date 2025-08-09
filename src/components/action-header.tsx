import React from 'react';
import { Box, Text } from 'ink';
import { ActionType } from '@/types/index.js';

interface ActionHeaderProps {
  action: ActionType;
  query: string;
}

const actionConfig = {
  analyze: { emoji: '🔍', color: 'magenta', label: 'ANALYZE' },
  ask: { emoji: '💭', color: 'blue', label: 'ASK' },
  explain: { emoji: '📚', color: 'green', label: 'EXPLAIN' },
  teach: { emoji: '🎓', color: 'yellow', label: 'TEACH' },
  chat: { emoji: '💬', color: 'cyan', label: 'CHAT' },
} as const;

export const ActionHeader: React.FC<ActionHeaderProps> = ({ action, query }) => {
  const config = actionConfig[action] || actionConfig.ask;
  
  return (
    <Box flexDirection="column" marginTop={1} marginBottom={1}>
      <Box flexDirection="row" alignItems="center">
        <Text>
          {config.emoji} <Text bold color={config.color}>{config.label}</Text>
        </Text>
        <Text color="gray" dimColor> • </Text>
        <Text wrap="wrap">{query}</Text>
      </Box>
      <Box marginTop={0.5}>
        <Text color="gray">
          {'─'.repeat(Math.min(process.stdout.columns - 4, 80))}
        </Text>
      </Box>
    </Box>
  );
};

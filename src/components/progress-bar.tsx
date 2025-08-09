import React from 'react';
import { Box, Text } from 'ink';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  width?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  current, 
  total, 
  label,
  width = 40 
}) => {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;

  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  return (
    <Box flexDirection="column" marginY={0.5}>
      {label && (
        <Box marginBottom={1}>
          <Text color="cyan" bold>
            {label}
          </Text>
        </Box>
      )}
      <Box flexDirection="row" alignItems="center">
        <Text color="green">{bar}</Text>
        <Box marginLeft={1}>
          <Text color="white" bold>
            {percentage}%
          </Text>
        </Box>
        <Box marginLeft={1}>
          <Text color="gray">
            ({current}/{total})
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

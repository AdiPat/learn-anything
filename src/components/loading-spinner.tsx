import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface LoadingSpinnerProps {
  text?: string;
  type?: 'dots' | 'dots12' | 'line' | 'arc' | 'bouncingBar';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  text = 'Loading...', 
  type = 'dots12' 
}) => {
  return (
    <Box flexDirection="row" alignItems="center">
      <Text color="cyan">
        <Spinner type={type} />
      </Text>
      <Box marginLeft={1}>
        <Text color="cyan">{text}</Text>
      </Box>
    </Box>
  );
};

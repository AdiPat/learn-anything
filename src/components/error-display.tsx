import React from 'react';
import { Box, Text } from 'ink';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  suggestion?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  title = 'Error', 
  message,
  suggestion 
}) => {
  return (
    <Box marginY={1}>
      <Box
        borderStyle="round"
        borderColor="red"
        paddingX={2}
        paddingY={1}
      >
        <Box flexDirection="column">
          <Box flexDirection="row" alignItems="center" marginBottom={1}>
            <Text color="red" bold>❌ {title}</Text>
          </Box>
          
          <Box marginBottom={suggestion ? 1 : 0}>
            <Text wrap="wrap" color="white">
              {message}
            </Text>
          </Box>

          {suggestion && (
            <Box>
              <Text color="yellow" bold>💡 Suggestion: </Text>
              <Text wrap="wrap" color="gray">
                {suggestion}
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

import React from 'react';
import { Box, Text } from 'ink';

interface SuccessDisplayProps {
  title?: string;
  message: string;
  details?: string;
}

export const SuccessDisplay: React.FC<SuccessDisplayProps> = ({ 
  title = 'Success', 
  message,
  details 
}) => {
  return (
    <Box marginY={1}>
      <Box
        borderStyle="round"
        borderColor="green"
        paddingX={2}
        paddingY={1}
      >
        <Box flexDirection="column">
          <Box flexDirection="row" alignItems="center" marginBottom={1}>
            <Text color="green" bold>✅ {title}</Text>
          </Box>
          
          <Box marginBottom={details ? 1 : 0}>
            <Text wrap="wrap" color="white">
              {message}
            </Text>
          </Box>

          {details && (
            <Box>
              <Text wrap="wrap" color="gray">
                {details}
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

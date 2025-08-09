import React from 'react';
import { Box, Text } from 'ink';

interface InfoDisplayProps {
  title: string;
  content: string;
  icon?: string;
}

export const InfoDisplay: React.FC<InfoDisplayProps> = ({ 
  title, 
  content,
  icon = 'ℹ️'
}) => {
  return (
    <Box marginY={1}>
      <Box
        borderStyle="round"
        borderColor="blue"
        paddingX={2}
        paddingY={1}
      >
        <Box flexDirection="column">
          <Box flexDirection="row" alignItems="center" marginBottom={1}>
            <Text color="blue" bold>{icon} {title}</Text>
          </Box>
          
          <Box>
            <Text wrap="wrap" color="white">
              {content}
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

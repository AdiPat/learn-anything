import * as React from 'react';
import { Box, Text } from 'ink';

interface WelcomeProps {
  version?: string;
}

export const Welcome: React.FC<WelcomeProps> = ({ version = '1.0.0' }) => {
  return (
    <Box flexDirection="column" marginTop={1} marginBottom={1}>
      <Box 
        borderStyle="round" 
        borderColor="cyan" 
        paddingX={2} 
        paddingY={1}
      >
        <Box flexDirection="column" alignItems="center">
          <Text bold color="cyan">
            🧠 LEAN - Learn Anything
          </Text>
          <Text color="gray" dimColor>
            Powered by AI • Learn anything, anytime
          </Text>
          <Text color="gray" dimColor>
            v{version}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

import React from 'react';
import { Box, Text } from 'ink';
import { ActionType } from '@/types/index.js';
import { MarkdownRenderer as ProductionMarkdownRenderer } from './ui/markdown-renderer.js';

interface ResponseDisplayProps {
  content: string;
  action: ActionType;
  isStreaming?: boolean;
}

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ 
  content, 
  action,
  isStreaming = false 
}) => {
  // If we're streaming, show raw text with a cursor
  if (isStreaming) {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Box flexDirection="row" alignItems="center" marginBottom={1}>
                  <Text color="green" bold>🤖 Assistant</Text>
        <Box marginLeft={1}>
          <Text color="gray" dimColor>
            {action === 'chat' ? 'chatting...' : `${action}ing...`}
          </Text>
        </Box>
        </Box>
        <Box flexDirection="column" paddingLeft={2}>
          <Text wrap="wrap">{content}</Text>
          <Text color="cyan">▋</Text>
        </Box>
      </Box>
    );
  }

  // For complete responses, use markdown rendering
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box flexDirection="row" alignItems="center" marginBottom={1}>
        <Text color="green" bold>🤖 Assistant</Text>
        <Box marginLeft={1}>
          <Text color="gray" dimColor>
            completed
          </Text>
        </Box>
      </Box>
      <Box flexDirection="column" paddingLeft={2}>
        <ProductionMarkdownRenderer content={content} />
      </Box>
    </Box>
  );
};

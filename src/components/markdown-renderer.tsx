import React from 'react';
import { Box, Text } from 'ink';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Simple markdown parsing for better display
  const lines = content.split('\n');
  
  return (
    <Box flexDirection="column">
      {lines.map((line, index) => {
        // Headers
        if (line.startsWith('# ')) {
          return (
            <Box key={index} marginY={1}>
              <Text bold color="green" underline>
                {line.substring(2)}
              </Text>
            </Box>
          );
        }
        
        if (line.startsWith('## ')) {
          return (
            <Box key={index} marginY={0.5}>
              <Text bold color="cyan">
                {line.substring(3)}
              </Text>
            </Box>
          );
        }
        
        if (line.startsWith('### ')) {
          return (
            <Box key={index}>
              <Text bold color="blue">
                {line.substring(4)}
              </Text>
            </Box>
          );
        }
        
        // Code blocks
        if (line.startsWith('```')) {
          return (
            <Box key={index} marginY={0.5}>
              <Text color="gray">
                {line}
              </Text>
            </Box>
          );
        }
        
        // Lists
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <Box key={index} marginLeft={2}>
              <Text color="yellow">• </Text>
              <Text>{line.substring(2)}</Text>
            </Box>
          );
        }
        
        // Numbered lists
        if (/^\d+\.\s/.test(line)) {
          const match = line.match(/^(\d+)\.\s(.+)$/);
          if (match) {
            return (
              <Box key={index} marginLeft={2}>
                <Text color="cyan" bold>{match[1]}. </Text>
                <Text>{match[2]}</Text>
              </Box>
            );
          }
        }
        
        // Bold text (simple **text** pattern)
        const boldProcessed = line.replace(/\*\*(.+?)\*\*/g, (_, text) => text);
        
        // Code (simple `code` pattern)
        const codeProcessed = boldProcessed.replace(/`(.+?)`/g, (_, text) => `[${text}]`);
        
        // Empty lines
        if (line.trim() === '') {
          return <Box key={index} height={1} />;
        }
        
        // Regular text
        return (
          <Box key={index}>
            <Text wrap="wrap">{codeProcessed}</Text>
          </Box>
        );
      })}
    </Box>
  );
};

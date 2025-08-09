import React, { useState, useCallback } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { LoadingSpinner } from './loading-spinner.js';
import { ResponseDisplay } from './response-display.js';
import { ChatMessage } from '@/types/index.js';

interface ChatInterfaceProps {
  onMessage: (message: string) => Promise<void>;
  onExit: () => void;
  isLoading: boolean;
  currentResponse: string;
  isStreaming?: boolean;
  messages: ChatMessage[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onMessage,
  onExit,
  isLoading,
  currentResponse = '',
  isStreaming = false,
  messages
}) => {
  const [input, setInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(true);
  const { exit } = useApp();

  const handleSubmit = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    
    // Check for exit commands
    if (['exit', 'quit', 'bye', '/exit', '/quit'].includes(trimmed.toLowerCase())) {
      onExit();
      return;
    }

    setInput('');
    setIsInputFocused(false);
    await onMessage(trimmed);
    setIsInputFocused(true);
  }, [onMessage, onExit]);

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
    }
  });

  // Filter out system messages for display
  const displayMessages = messages.filter(msg => msg.role !== 'system');

  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box marginBottom={1}>
        <Text color="cyan" bold>💬 Interactive Chat Session</Text>
      </Box>
      
      <Box marginBottom={1}>
        <Text color="gray" dimColor>
          Type your message and press Enter. Use "exit", "quit", or "bye" to end the session.
        </Text>
      </Box>

      {/* Message History */}
      <Box flexDirection="column" flexGrow={1} marginBottom={1}>
        {displayMessages.map((message, index) => {
          if (message.role === 'user') {
            return (
              <Box key={index} marginBottom={1}>
                <Box flexDirection="row" alignItems="center">
                  <Text color="blue" bold>👤 You:</Text>
                </Box>
                <Box paddingLeft={1} marginTop={0.5}>
                  <Text wrap="wrap">{message.content}</Text>
                </Box>
              </Box>
            );
          } else if (message.role === 'assistant') {
            return (
              <Box key={index} marginBottom={1}>
                <ResponseDisplay 
                  content={message.content} 
                  action="chat"
                  isStreaming={false}
                />
              </Box>
            );
          }
          return null;
        })}

        {/* Current response preview (non-streaming flow: keep hidden) */}
        {false && isStreaming && currentResponse && (
          <ResponseDisplay 
            content={currentResponse} 
            action="chat"
            isStreaming={true}
          />
        )}

        {/* Loading indicator */}
        {isLoading && !isStreaming && (
          <Box marginTop={1}>
            <LoadingSpinner text="Thinking..." />
          </Box>
        )}
      </Box>

      {/* Input Area */}
      <Box flexDirection="column" borderStyle="round" borderColor="blue" paddingX={1} paddingY={0.5}>
        <Box flexDirection="row" alignItems="center">
          <Text color="blue" bold>👤 You: </Text>
          {isInputFocused && !isLoading && (
            <TextInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              placeholder="Type your message..."
              focus={true}
            />
          )}
          {(isLoading || !isInputFocused) && (
            <Text color="gray" dimColor>
              {isLoading ? 'Waiting for response...' : 'Processing...'}
            </Text>
          )}
        </Box>
      </Box>

      {/* Help text */}
      <Box marginTop={0.5}>
        <Text color="gray" dimColor>
          Ctrl+C to exit • "exit", "quit", or "bye" to end chat
        </Text>
      </Box>
    </Box>
  );
};

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { MarkdownRenderer } from './markdown-renderer.js';

interface StreamingMarkdownProps {
  stream: AsyncIterable<string>;
  action?: string;
}

export const StreamingMarkdown: React.FC<StreamingMarkdownProps> = ({ stream, action = 'default' }) => {
  const [content, setContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processStream = async () => {
      try {
        for await (const chunk of stream) {
          setContent(prev => prev + chunk);
        }
        setIsComplete(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Stream error occurred');
        setIsComplete(true);
      }
    };

    processStream();
  }, [stream]);

  if (error) {
    return (
      <Box
        borderStyle="round"
        borderColor="red"
        paddingX={2}
        paddingY={1}
        marginY={1}
      >
        <Text color="red" bold>❌ Streaming Error: {error}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <MarkdownRenderer 
        content={content} 
        streaming={!isComplete}
        action={action}
      />
    </Box>
  );
};

// Alternative simpler streaming component for incremental updates
interface IncrementalStreamingProps {
  onChunk: (chunk: string) => void;
  children: (content: string, isStreaming: boolean) => React.ReactNode;
}

export const IncrementalStreaming: React.FC<IncrementalStreamingProps> = ({ 
  onChunk, 
  children 
}) => {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);

  // This would be called from outside to add chunks
  const addChunk = (chunk: string) => {
    setContent(prev => prev + chunk);
    onChunk(chunk);
  };

  const complete = () => {
    setIsStreaming(false);
  };

  // Expose methods via ref or callback
  React.useImperativeHandle(undefined, () => ({
    addChunk,
    complete
  }));

  return (
    <Box flexDirection="column">
      {children(content, isStreaming)}
    </Box>
  );
};

// Real-time markdown component with buffer management
interface RealTimeMarkdownProps {
  initialContent?: string;
  bufferSize?: number;
}

export const RealTimeMarkdown: React.FC<RealTimeMarkdownProps> = ({ 
  initialContent = '', 
  bufferSize = 1000 
}) => {
  const [content, setContent] = useState(initialContent);
  const [buffer, setBuffer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Method to append content
  const appendContent = (chunk: string) => {
    setBuffer(prev => {
      const newBuffer = prev + chunk;
      
      // If buffer is getting large, flush to content
      if (newBuffer.length > bufferSize) {
        setContent(current => current + newBuffer);
        return '';
      }
      
      return newBuffer;
    });
  };

  // Method to flush buffer and complete
  const complete = () => {
    setContent(current => current + buffer);
    setBuffer('');
    setIsStreaming(false);
  };

  const displayContent = content + buffer;

  return (
    <Box flexDirection="column">
      <MarkdownRenderer 
        content={displayContent} 
        streaming={isStreaming}
      />
      
      {/* Expose methods for external control */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.markdownStream = {
              append: ${appendContent.toString()},
              complete: ${complete.toString()},
              setStreaming: ${setIsStreaming.toString()}
            }
          `
        }}
      />
    </Box>
  );
};

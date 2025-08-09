import React, { useState, useCallback } from 'react';
import { render } from 'ink';
import { AIService } from './ai.js';
// Legacy import removed: ReactUIManager is consolidated into UI
import { ChatInterface } from '@/components/index.js';
import { ChatMessage } from '@/types/index.js';

export class ReactChatSession {
  private aiService: AIService;
  private messages: ChatMessage[] = [];
  private isRunning: boolean = false;
  private appInstance: any = null;

  constructor(aiService: AIService) {
    this.aiService = aiService;

    // Initialize with system message
    this.messages.push({
      role: 'system',
      content:
        'You are a helpful, knowledgeable, and friendly AI assistant. Engage in natural conversation while providing accurate and useful information.',
    });
  }

  async start(): Promise<void> {
    this.isRunning = true;

    const ChatApp: React.FC = () => {
      const [messages, setMessages] = useState<ChatMessage[]>(this.messages);
      const [isLoading, setIsLoading] = useState(false);
      const [currentResponse, setCurrentResponse] = useState('');
      const [isStreaming, setIsStreaming] = useState(false);

      const handleMessage = useCallback(async (userInput: string) => {
        // Add user message
        const userMessage: ChatMessage = {
          role: 'user',
          content: userInput,
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        this.messages = updatedMessages;

        setIsLoading(true);
        setCurrentResponse('');
        setIsStreaming(true);

        try {
          let fullResponse = '';
          
          // Stream the response
          for await (const chunk of this.aiService.streamChatCompletion(this.messages)) {
            fullResponse += chunk;
            setCurrentResponse(fullResponse);
          }

          // Add assistant response to messages
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: fullResponse,
          };

          const finalMessages = [...updatedMessages, assistantMessage];
          setMessages(finalMessages);
          this.messages = finalMessages;
          
          setIsStreaming(false);
          setCurrentResponse('');
        } catch (error) {
          setIsStreaming(false);
          setCurrentResponse('');
          // Error handling could be improved here
          console.error('Chat error:', error);
        } finally {
          setIsLoading(false);
        }
      }, [messages]);

      const handleExit = useCallback(() => {
        this.stop();
      }, []);

      return (
        <ChatInterface
          onMessage={handleMessage}
          onExit={handleExit}
          isLoading={isLoading}
          currentResponse={currentResponse}
          isStreaming={isStreaming}
          messages={messages}
        />
      );
    };

    this.appInstance = render(<ChatApp />);
    
    // Wait for the chat to finish
    return new Promise<void>((resolve) => {
      const checkRunning = () => {
        if (!this.isRunning) {
          resolve();
        } else {
          setTimeout(checkRunning, 100);
        }
      };
      checkRunning();
    });
  }

  stop(): void {
    this.isRunning = false;
    if (this.appInstance) {
      this.appInstance.unmount();
      this.appInstance = null;
    }
    console.log('\n👋 Chat session ended. Have a great day!\n');
  }

  getMessageHistory(): ChatMessage[] {
    return [...this.messages];
  }

  clearHistory(): void {
    this.messages = [this.messages[0]!]; // Keep system message
  }
}

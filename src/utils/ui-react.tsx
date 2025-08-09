import React, { useState, useEffect } from 'react';
import { render, Box } from 'ink';
import { 
  Welcome, 
  ActionHeader, 
  LoadingSpinner, 
  ResponseDisplay, 
  ErrorDisplay, 
  SuccessDisplay, 
  InfoDisplay,
  ChatInterface
} from '@/components/index.js';
import { ActionType, ChatMessage } from '@/types/index.js';

interface AppState {
  mode: 'welcome' | 'action' | 'chat' | 'error' | 'success' | 'info';
  action?: ActionType;
  query?: string;
  isLoading: boolean;
  response?: string;
  isStreaming: boolean;
  error?: string;
  success?: string;
  info?: { title: string; content: string };
  messages: ChatMessage[];
}

interface AppProps {
  initialState: Partial<AppState>;
  onMessage: (message: string) => Promise<void>;
  onExit: () => void;
}

const App: React.FC<AppProps> = ({ initialState, onMessage, onExit }) => {
  const [state, setState] = useState<AppState>({
    mode: 'welcome',
    isLoading: false,
    isStreaming: false,
    response: '',
    messages: [],
    ...initialState
  });

  useEffect(() => {
    setState(prev => ({ ...prev, ...initialState }));
  }, [initialState]);

  const handleMessage = async (message: string) => {
    await onMessage(message);
  };

  const handleExit = () => {
    onExit();
  };

  return (
    <Box flexDirection="column" height="100%">
      {state.mode === 'welcome' && (
        <Welcome version="1.0.0" />
      )}

      {state.mode === 'action' && state.action && state.query && (
        <Box flexDirection="column">
          <Welcome version="1.0.0" />
          <ActionHeader action={state.action} query={state.query} />
          
          {state.isLoading && (
            <LoadingSpinner text="Generating response..." />
          )}
          
          {state.response && (
            <ResponseDisplay 
              content={state.response} 
              action={state.action}
              isStreaming={state.isStreaming}
            />
          )}
        </Box>
      )}

      {state.mode === 'chat' && (
        <Box flexDirection="column">
          <Welcome version="1.0.0" />
          <ChatInterface
            onMessage={handleMessage}
            onExit={handleExit}
            isLoading={state.isLoading}
            currentResponse={state.response || ''}
            isStreaming={state.isStreaming}
            messages={state.messages}
          />
        </Box>
      )}

      {state.mode === 'error' && state.error && (
        <Box flexDirection="column">
          <Welcome version="1.0.0" />
          <ErrorDisplay 
            message={state.error}
            suggestion="Please check your configuration and try again."
          />
        </Box>
      )}

      {state.mode === 'success' && state.success && (
        <Box flexDirection="column">
          <Welcome version="1.0.0" />
          <SuccessDisplay message={state.success} />
        </Box>
      )}

      {state.mode === 'info' && state.info && (
        <Box flexDirection="column">
          <Welcome version="1.0.0" />
          <InfoDisplay 
            title={state.info.title} 
            content={state.info.content} 
          />
        </Box>
      )}
    </Box>
  );
};

export class ReactUIManager {
  private appInstance: any = null;
  private updateState: ((state: Partial<AppState>) => void) | null = null;

  public showWelcome(): void {
    this.render({ mode: 'welcome' });
  }

  public showAction(action: ActionType, query: string): void {
    this.render({ 
      mode: 'action', 
      action, 
      query,
      isLoading: false,
      response: '',
      isStreaming: false
    });
  }

  public startSpinner(_text: string = 'Loading...'): void {
    this.updateState?.({ isLoading: true });
  }

  public updateSpinner(_text: string): void {
    // React Ink doesn't need explicit spinner updates, handled by state
  }

  public stopSpinner(_message?: string): void {
    this.updateState?.({ isLoading: false });
  }

  public failSpinner(message?: string): void {
    this.updateState?.({ isLoading: false });
    if (message) {
      this.showError(message);
    }
  }

  public showError(error: string): void {
    this.render({ mode: 'error', error });
  }

  public showSuccess(message: string): void {
    this.render({ mode: 'success', success: message });
  }

  public showInfo(title: string, content: string): void {
    this.render({ mode: 'info', info: { title, content } });
  }

  public updateResponse(content: string, isStreaming: boolean = false): void {
    this.updateState?.({ response: content, isStreaming });
  }

  public startChat(
    messages: ChatMessage[],
    onMessage: (message: string) => Promise<void>,
    onExit: () => void
  ): void {
    this.render({ 
      mode: 'chat', 
      messages,
      isLoading: false,
      response: '',
      isStreaming: false
    }, onMessage, onExit);
  }

  public updateChatMessages(messages: ChatMessage[]): void {
    this.updateState?.({ messages });
  }

  public startStreaming(): void {
    this.updateState?.({ isStreaming: true, response: '' });
  }

  public appendStreamContent(_chunk: string): void {
    // Note: This requires the app to manage the accumulated content
    // The actual implementation will need to handle this in the calling code
  }

  public stopStreaming(): void {
    this.updateState?.({ isStreaming: false });
  }

  private render(
    initialState: Partial<AppState>, 
    onMessage: (message: string) => Promise<void> = async () => {},
    onExit: () => void = () => {}
  ): void {
    if (this.appInstance) {
      this.appInstance.unmount();
    }

    let stateUpdater: ((state: Partial<AppState>) => void) | null = null;

    const AppWithState: React.FC = () => {
      const [state, setState] = useState<AppState>({
        mode: 'welcome',
        isLoading: false,
        isStreaming: false,
        response: '',
        messages: [],
        ...initialState
      });

      useEffect(() => {
        stateUpdater = (newState: Partial<AppState>) => {
          setState(prev => ({ ...prev, ...newState }));
        };
      }, []);

      return (
        <App 
          initialState={state} 
          onMessage={onMessage}
          onExit={onExit}
        />
      );
    };

    this.appInstance = render(<AppWithState />);
    this.updateState = stateUpdater;
  }

  public unmount(): void {
    if (this.appInstance) {
      this.appInstance.unmount();
      this.appInstance = null;
      this.updateState = null;
    }
  }

  // Legacy methods for compatibility
  public formatAction(action: string): string {
    return action.toUpperCase();
  }

  public formatResponse(content: string, _action: string): string {
    return content; // Formatting is now handled by React components
  }

  public showTypingAnimation(_text: string, _delay: number = 30): Promise<void> {
    // This could be implemented as a React component if needed
    return Promise.resolve();
  }
}

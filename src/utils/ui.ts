import React, { useEffect, useState } from 'react';
import { render, Box } from 'ink';
import {
  Welcome,
  ActionHeader,
  LoadingSpinner,
  ResponseDisplay,
  ErrorDisplay,
  SuccessDisplay,
  InfoDisplay,
} from '@/components/index.js';
import { ActionType } from '@/types/index.js';

type Mode = 'welcome' | 'action' | 'error' | 'success' | 'info';

interface UIState {
  mode: Mode;
  action?: ActionType;
  query?: string;
  isLoading: boolean;
  isStreaming: boolean;
  response?: string;
  error?: string;
  success?: string;
  info?: { title: string; content: string };
}

type Updater = (state: Partial<UIState>) => void;

interface AppProps {
  initial: Partial<UIState>;
  onUpdateReady: (fn: Updater) => void;
}

const h = React.createElement;

const App: React.FC<AppProps> = ({ initial, onUpdateReady }) => {
  const [state, setState] = useState<UIState>({
    mode: 'welcome',
    isLoading: false,
    isStreaming: false,
    response: '',
    ...initial,
  });

  useEffect(() => {
    onUpdateReady((s) => setState((prev) => ({ ...prev, ...s })));
  }, [onUpdateReady]);

  const children: Array<React.ReactNode> = [];

  if (state.mode === 'welcome') {
    children.push(h(Welcome as any, { version: '1.0.0' }));
  }

  if (state.mode === 'action' && state.action && state.query) {
    children.push(
      h(
        Box as any,
        { flexDirection: 'column' },
        h(Welcome as any, { version: '1.0.0' }),
        h(ActionHeader as any, { action: state.action, query: state.query }),
        state.isLoading ? h(LoadingSpinner as any, { text: 'Generating response...' }) : null,
        state.response
          ? h(ResponseDisplay as any, {
              content: state.response,
              action: state.action,
              isStreaming: state.isStreaming,
            })
          : null
      )
    );
  }

  if (state.mode === 'error' && state.error) {
    children.push(
      h(
        Box as any,
        { flexDirection: 'column' },
        h(Welcome as any, { version: '1.0.0' }),
        h(ErrorDisplay as any, {
          message: state.error,
          suggestion: 'Please check your configuration and try again.',
        })
      )
    );
  }

  if (state.mode === 'success' && state.success) {
    children.push(
      h(
        Box as any,
        { flexDirection: 'column' },
        h(Welcome as any, { version: '1.0.0' }),
        h(SuccessDisplay as any, { message: state.success })
      )
    );
  }

  if (state.mode === 'info' && state.info) {
    children.push(
      h(
        Box as any,
        { flexDirection: 'column' },
        h(Welcome as any, { version: '1.0.0' }),
        h(InfoDisplay as any, { title: state.info.title, content: state.info.content })
      )
    );
  }

  return h(Box as any, { flexDirection: 'column' }, ...children);
};

export class UI {
  private appInstance: any = null;
  private updateState: Updater | null = null;

  private render(initial: Partial<UIState>): void {
    if (this.appInstance && this.updateState) {
      this.updateState(initial);
      return;
    }

    const onUpdateReady = (fn: Updater) => {
      this.updateState = fn;
    };

    this.appInstance = render(h(App, { initial, onUpdateReady }));
  }

  public showWelcome(): void {
    this.render({ mode: 'welcome' });
  }

  public showActionHeader(action: ActionType, query: string): void {
    this.render({
      mode: 'action',
      action,
      query,
      isLoading: false,
      isStreaming: false,
      response: '',
    });
  }

  public startSpinner(_text: string = 'Loading...'): void {
    this.render({});
    this.updateState?.({ isLoading: true, isStreaming: false });
  }

  public updateSpinner(_text: string): void {
    // reserved for future use
  }

  public stopSpinner(_message?: string): void {
    this.updateState?.({ isLoading: false });
  }

  public failSpinner(_message?: string): void {
    this.updateState?.({ isLoading: false });
  }

  public showResponse(content: string, action: ActionType): void {
    this.updateState?.({ response: content, action, mode: 'action' });
  }

  public startStreaming(): void {
    this.updateState?.({ isStreaming: true, isLoading: false });
  }

  public showStreamingResponse(content: string): void {
    this.updateState?.({ response: content, isStreaming: true });
  }

  public stopStreaming(): void {
    this.updateState?.({ isStreaming: false });
  }

  public showError(message: string): void {
    this.render({ mode: 'error', error: message });
  }

  public showSuccess(message: string): void {
    this.render({ mode: 'success', success: message });
  }

  public showInfo(title: string, content: string): void {
    this.render({ mode: 'info', info: { title, content } });
  }

  public unmount(): void {
    if (this.appInstance) {
      this.appInstance.unmount();
      this.appInstance = null;
      this.updateState = null;
    }
  }
}

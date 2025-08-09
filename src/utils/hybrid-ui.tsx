import React from 'react';
import { render } from 'ink';
import { Box, Text } from 'ink';
import chalk from 'chalk';
import boxen from 'boxen';
import { MarkdownFormatter } from './markdown.js';
import { EnhancedUIManager } from './enhanced-ui.js';
import { HybridMarkdownRenderer, StreamingMarkdown } from '../components/index.js';

interface HybridUIOptions {
  useInkComponents?: boolean;
  preferTerminalForMarkdown?: boolean;
  enableStreamingInk?: boolean;
}

export class HybridUIManager extends EnhancedUIManager {
  private useInkComponents: boolean;
  private preferTerminalForMarkdown: boolean;
  private enableStreamingInk: boolean;
  private currentInkInstance: any = null;

  constructor(options: HybridUIOptions = {}) {
    super();
    this.useInkComponents = options.useInkComponents ?? true;
    this.preferTerminalForMarkdown = options.preferTerminalForMarkdown ?? false;
    this.enableStreamingInk = options.enableStreamingInk ?? true;
  }

  // Override showResponse to use hybrid approach
  public showResponse(content: string, action: string): void {
    console.log('\n' + chalk.green.bold('🤖 Assistant') + chalk.gray.dim(' • completed'));
    console.log('');

    if (this.useInkComponents && !this.preferTerminalForMarkdown) {
      // Use Ink components for rich markdown rendering
      this.renderMarkdownWithInk(content, action);
    } else {
      // Use our production-grade terminal formatter
      const formatted = MarkdownFormatter.format(content);
      
      // Wrap in a subtle box for Claude-like appearance
      const response = boxen(formatted, {
        padding: { top: 0, bottom: 0, left: 2, right: 2 },
        borderStyle: 'single',
        borderColor: 'gray',
        backgroundColor: '#0a0a0a',
      });
      
      console.log(response);
    }
  }

  // Stream response with hybrid approach
  public streamResponse(stream: AsyncIterable<string>, action: string = 'default'): void {
    if (this.enableStreamingInk && this.useInkComponents) {
      this.streamWithInk(stream, action);
    } else {
      this.streamToTerminal(stream);
    }
  }

  private renderMarkdownWithInk(content: string, action: string): void {
    const MarkdownComponent: React.FC = () => (
      <Box flexDirection="column" paddingX={2}>
        <HybridMarkdownRenderer content={content} action={action} />
      </Box>
    );

    // Clean up previous instance
    if (this.currentInkInstance) {
      this.currentInkInstance.unmount();
    }

    this.currentInkInstance = render(<MarkdownComponent />);
  }

  private streamWithInk(stream: AsyncIterable<string>, action: string): void {
    const StreamComponent: React.FC = () => (
      <Box flexDirection="column" paddingX={2}>
        <Text color="green" bold>🤖 Assistant</Text>
        <Text color="gray" dimColor> • streaming...</Text>
        <StreamingMarkdown stream={stream} action={action} />
      </Box>
    );

    // Clean up previous instance
    if (this.currentInkInstance) {
      this.currentInkInstance.unmount();
    }

    this.currentInkInstance = render(<StreamComponent />);
  }

  private async streamToTerminal(stream: AsyncIterable<string>): Promise<void> {
    console.log('\n' + chalk.green.bold('🤖 Assistant') + chalk.gray.dim(' • streaming...'));
    console.log('');

    let buffer = '';
    let lastFormattedLength = 0;

    for await (const chunk of stream) {
      buffer += chunk;
      
      // Format and display every few chunks to avoid too much processing
      if (buffer.length - lastFormattedLength > 50 || chunk.includes('\n')) {
        // Clear previous content
        if (lastFormattedLength > 0) {
          process.stdout.write('\r\x1b[K');
        }
        
        // Format and display current buffer
        const formatted = this.formatStreamingMarkdown(buffer);
        process.stdout.write(formatted + chalk.cyan.dim(' ▋'));
        
        lastFormattedLength = formatted.length;
      }
    }

    // Final render with full formatting
    process.stdout.write('\r\x1b[K');
    const finalFormatted = MarkdownFormatter.format(buffer);
    console.log(finalFormatted);
  }

  private formatStreamingMarkdown(content: string): string {
    // Lightweight formatting for streaming (avoid heavy processing)
    return content
      .split('\n')
      .map(line => {
        if (line.startsWith('# ')) {
          return chalk.green.bold(line);
        } else if (line.startsWith('## ')) {
          return chalk.cyan.bold(line);
        } else if (line.startsWith('### ')) {
          return chalk.blue.bold(line);
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          return chalk.yellow('• ') + line.substring(2);
        } else if (line.match(/^\d+\.\s/)) {
          return line.replace(/^(\d+)\.\s/, chalk.cyan.bold('$1. '));
        }
        return line;
      })
      .join('\n');
  }

  // Enhanced method to show complex content with tables, math, etc.
  public showRichContent(content: string, _type: 'markdown' | 'table' | 'math' | 'mixed' = 'markdown'): void {
    if (this.useInkComponents) {
      const RichContentComponent: React.FC = () => (
        <Box flexDirection="column" paddingX={2}>
          <HybridMarkdownRenderer content={content} />
        </Box>
      );

      if (this.currentInkInstance) {
        this.currentInkInstance.unmount();
      }

      this.currentInkInstance = render(<RichContentComponent />);
    } else {
      // Fallback to enhanced terminal formatting
      const formatted = MarkdownFormatter.format(content);
      console.log('\n' + formatted + '\n');
    }
  }

  // Method to toggle between modes
  public setRenderingMode(useInk: boolean, preferTerminalMarkdown: boolean = false): void {
    this.useInkComponents = useInk;
    this.preferTerminalForMarkdown = preferTerminalMarkdown;
  }

  // Method to test different rendering approaches
  public testRenderingModes(content: string): void {
    console.log('\n' + chalk.yellow.bold('='.repeat(60)));
    console.log(chalk.yellow.bold('Testing Terminal Rendering:'));
    console.log(chalk.yellow.bold('='.repeat(60)));
    
    const terminalFormatted = MarkdownFormatter.format(content);
    console.log(terminalFormatted);
    
    console.log('\n' + chalk.cyan.bold('='.repeat(60)));
    console.log(chalk.cyan.bold('Testing Ink Component Rendering:'));
    console.log(chalk.cyan.bold('='.repeat(60)));
    
    this.renderMarkdownWithInk(content, 'test');
    
    // Wait a bit then restore
    setTimeout(() => {
      if (this.currentInkInstance) {
        this.currentInkInstance.unmount();
        this.currentInkInstance = null;
      }
    }, 3000);
  }

  // Clean up method
  public cleanup(): void {
    if (this.currentInkInstance) {
      this.currentInkInstance.unmount();
      this.currentInkInstance = null;
    }
  }
}

// Helper function to create a demo component
export const createMarkdownDemo = (content: string): React.FC => {
  return () => (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text color="cyan" bold>🎨 Hybrid Markdown Renderer Demo</Text>
      </Box>
      <HybridMarkdownRenderer content={content} />
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          ✨ This combines our production MarkdownFormatter logic with beautiful Ink components!
        </Text>
      </Box>
    </Box>
  );
};

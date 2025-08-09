import chalk from 'chalk';
import boxen from 'boxen';
import inquirer from 'inquirer';
import { AIService } from './ai.js';
import { UI } from '@/utils/ui.js';
import { ChatMessage } from '@/types/index.js';

export class ChatSession {
  private aiService: AIService;
  private ui: UI;
  private messages: ChatMessage[] = [];
  private isRunning: boolean = false;

  constructor(aiService: AIService) {
    this.aiService = aiService;
    this.ui = new UI();

    // Initialize with system message
    this.messages.push({
      role: 'system',
      content:
        'You are a helpful, knowledgeable, and friendly AI assistant. Engage in natural conversation while providing accurate and useful information.',
    });
  }

  async start(): Promise<void> {
    this.isRunning = true;

    // Show chat header
    this.showChatHeader();

    try {
      while (this.isRunning) {
        await this.handleChatTurn();
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('User force closed')) {
        // User pressed Ctrl+C, exit gracefully
        this.stop();
        return;
      }
      throw error;
    }
  }

  stop(): void {
    this.isRunning = false;
    console.log();
    console.log(chalk.cyan('👋 Chat session ended. Have a great day!'));
    console.log();
  }

  private showChatHeader(): void {
    const headerContent = `${chalk.cyan.bold('💬 Interactive Chat Session')}

${chalk.gray('Type your message and press Enter.')}
${chalk.gray('Use "exit", "quit", or "bye" to end the session.')}
${chalk.gray('Press Ctrl+C to force exit.')}`;

    const headerBox = boxen(headerContent, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      backgroundColor: '#0a0a0a',
    });

    console.log(headerBox);
  }

  private async handleChatTurn(): Promise<void> {
    try {
      // Get user input
      const { userInput } = await inquirer.prompt([
        {
          type: 'input',
          name: 'userInput',
          message: chalk.blue.bold('👤 You:'),
          validate: (input: string) => {
            if (!input.trim()) {
              return 'Please enter a message';
            }
            return true;
          },
        },
      ]);

      const trimmedInput = userInput.trim();

      // Check for exit commands
      if (['exit', 'quit', 'bye', '/exit', '/quit'].includes(trimmedInput.toLowerCase())) {
        this.stop();
        return;
      }

      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: trimmedInput,
      };
      this.messages.push(userMessage);

      // Show user message in a nice format
      this.showUserMessage(trimmedInput);

      // Show thinking spinner
      this.ui.startSpinner('🤔 Thinking...');

      try {
        // Get AI response
        const response = await this.aiService.chatCompletion(this.messages);

        // Stop spinner
        this.ui.stopSpinner();

        // Add assistant response to messages
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response,
        };
        this.messages.push(assistantMessage);

        // Show AI response
        this.showAssistantMessage(response);
      } catch (error) {
        this.ui.failSpinner('Failed to get response');

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        this.ui.showError(`Chat error: ${errorMessage}`);

        // Add error to conversation history
        const errorChatMessage: ChatMessage = {
          role: 'assistant',
          content: `Error: ${errorMessage}`,
        };
        this.messages.push(errorChatMessage);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('User force closed')) {
        // Re-throw to be handled by the main loop
        throw error;
      }

      console.error(chalk.red('An error occurred during chat:'), error);
      this.stop();
    }
  }

  private showUserMessage(content: string): void {
    console.log();
    const userBox = boxen(`${chalk.blue.bold('👤 You')}\n\n${chalk.white(content)}`, {
      padding: 1,
      margin: { top: 1, bottom: 0, left: 2, right: 1 },
      borderStyle: 'single',
      borderColor: 'blue',
      backgroundColor: '#001122',
    });
    console.log(userBox);
  }

  private showAssistantMessage(content: string): void {
    console.log();

    // Format the content using the UI formatter
    const formattedContent = this.formatMarkdown(content);

    const assistantBox = boxen(`${chalk.green.bold('🤖 Assistant')}\n\n${formattedContent}`, {
      padding: 1,
      margin: { top: 1, bottom: 1, left: 1, right: 2 },
      borderStyle: 'single',
      borderColor: 'green',
      backgroundColor: '#002200',
      width: Math.min(process.stdout.columns - 6, 96),
    });

    console.log(assistantBox);
  }

  private formatMarkdown(content: string): string {
    const lines = content.split('\n');
    const formattedLines: string[] = [];

    let inCodeBlock = false;

    for (const line of lines) {
      // Code blocks
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        formattedLines.push(chalk.gray(line));
        continue;
      }

      if (inCodeBlock) {
        formattedLines.push(chalk.cyan(line));
        continue;
      }

      // Headers
      if (line.startsWith('# ')) {
        formattedLines.push(chalk.yellow.bold(line.substring(2)));
        continue;
      }

      if (line.startsWith('## ')) {
        formattedLines.push(chalk.cyan.bold(line.substring(3)));
        continue;
      }

      if (line.startsWith('### ')) {
        formattedLines.push(chalk.blue.bold(line.substring(4)));
        continue;
      }

      // Lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        formattedLines.push(`  ${chalk.yellow('•')} ${line.substring(2)}`);
        continue;
      }

      // Numbered lists
      if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^(\d+)\.\s(.+)$/);
        if (match) {
          formattedLines.push(`  ${chalk.cyan.bold(match[1] + '.')} ${match[2]}`);
          continue;
        }
      }

      // Process inline formatting
      let processedLine = line;

      // Bold text
      processedLine = processedLine.replace(/\*\*(.+?)\*\*/g, (_, text) => chalk.bold(text));

      // Italic text
      processedLine = processedLine.replace(/\*(.+?)\*/g, (_, text) => chalk.italic(text));

      // Code (backticks)
      processedLine = processedLine.replace(/`(.+?)`/g, (_, text) =>
        chalk.bgGray.black(` ${text} `)
      );

      formattedLines.push(processedLine);
    }

    return formattedLines.join('\n');
  }

  getMessageHistory(): ChatMessage[] {
    return [...this.messages];
  }

  clearHistory(): void {
    this.messages = [this.messages[0]!]; // Keep system message
  }
}

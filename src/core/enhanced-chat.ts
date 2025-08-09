import inquirer from 'inquirer';
import chalk from 'chalk';
import { AIService } from './ai.js';
import { UI } from '@/utils/ui.js';
import { ChatMessage } from '@/types/index.js';

export class EnhancedChatSession {
  private aiService: AIService;
  private ui: UI;
  private messages: ChatMessage[] = [];
  private isRunning: boolean = false;

  constructor(aiService: AIService, ui: UI) {
    this.aiService = aiService;
    this.ui = ui;

    // Initialize with system message
    this.messages.push({
      role: 'system',
      content:
        'You are a helpful, knowledgeable, and friendly AI assistant. Engage in natural conversation while providing accurate and useful information.',
    });
  }

  async start(): Promise<void> {
    this.isRunning = true;

    // Show enhanced chat header
    console.log(chalk.cyan.bold('\n💬 Interactive Chat Session'));
    console.log(
      chalk.gray(
        'Type your message and press Enter. Use "exit", "quit", or "bye" to end the session.\n'
      )
    );

    while (this.isRunning) {
      try {
        // Enhanced prompt styling
        const { userInput } = await inquirer.prompt({
          type: 'input',
          name: 'userInput',
          message: chalk.blue.bold('👤 You:'),
          validate: (input: string) => input.trim().length > 0 || 'Please enter a message',
        });

        const trimmedInput = userInput.trim();

        // Check for exit commands
        if (['exit', 'quit', 'bye', '/exit', '/quit'].includes(trimmedInput.toLowerCase())) {
          this.stop();
          break;
        }

        // Add user message to history
        this.messages.push({
          role: 'user',
          content: trimmedInput,
        });

        // Show enhanced thinking indicator
        this.ui.startSpinner('Thinking...');

        try {
          // Disable streaming for chat: fetch full response once and render
          const fullResponse = await this.aiService.chatCompletion(this.messages);

          // Stop spinner and show completion
          this.ui.stopSpinner();
          console.log(chalk.green('\n🤖 Assistant') + chalk.gray.dim(' • completed'));
          console.log('');

          // Render a single clean markdown response
          this.ui.showResponse(fullResponse, 'chat');

          // Add assistant response to history
          this.messages.push({
            role: 'assistant',
            content: fullResponse,
          });
        } catch (error) {
          this.ui.failSpinner();
          this.ui.showError(error instanceof Error ? error.message : 'Unknown error occurred');
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('User force closed')) {
          this.stop();
          break;
        }
        this.ui.showError('An unexpected error occurred');
      }
    }
  }

  stop(): void {
    this.isRunning = false;

    // Enhanced goodbye message
    const goodbyeBox = chalk.cyan.bold(
      '\n┌─────────────────────────────────────┐\n' +
        '│  👋 Chat session ended.             │\n' +
        '│     Have a great day!               │\n' +
        '└─────────────────────────────────────┘\n'
    );
    console.log(goodbyeBox);
  }

  getMessageHistory(): ChatMessage[] {
    return [...this.messages];
  }

  clearHistory(): void {
    this.messages = [this.messages[0]!]; // Keep system message
  }
}

import inquirer from 'inquirer';
import chalk from 'chalk';
import { AIService } from './ai.js';
import { UI } from '@/utils/ui.js';
import { ChatMessage } from '@/types/index.js';

export class ChatSession {
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

    console.log(chalk.cyan.bold('\n💬 Starting interactive chat session...\n'));
    console.log(chalk.gray('Type "exit", "quit", or "bye" to end the session.\n'));

    while (this.isRunning) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { userInput } = await inquirer.prompt([
          {
            type: 'input',
            name: 'userInput',
            message: chalk.blue('You:'),
            validate: (input: string) => input.trim().length > 0 || 'Please enter a message',
          },
        ]);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const trimmedInput = userInput.trim();

        // Check for exit commands
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        if (['exit', 'quit', 'bye', '/exit', '/quit'].includes(trimmedInput.toLowerCase())) {
          this.stop();
          break;
        }

        // Add user message to history
        this.messages.push({
          role: 'user',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          content: trimmedInput,
        });

        // Show thinking indicator
        this.ui.startSpinner('Thinking...');

        try {
          // Stream the response
          console.log(chalk.green('\nAssistant: '));
          let fullResponse = '';

          this.ui.stopSpinner();

          for await (const chunk of this.aiService.streamChatCompletion(this.messages)) {
            process.stdout.write(chalk.white(chunk));
            fullResponse += chunk;
          }

          console.log('\n'); // Add newline after response

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
    console.log(chalk.cyan.bold('\n👋 Chat session ended. Have a great day!\n'));
  }

  getMessageHistory(): ChatMessage[] {
    return [...this.messages];
  }

  clearHistory(): void {
    this.messages = [this.messages[0]!]; // Keep system message
  }
}

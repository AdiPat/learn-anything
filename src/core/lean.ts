import { AIService } from '@/core/ai.js';
import { ChatSession } from '@/core/chat.js';
import { OutputManager } from '@/core/output.js';
import { UI } from '@/utils/ui.js';
import { loadConfig, getOpenAIApiKey, loadProfile } from '@/utils/config.js';
import { ProcessedOptions } from '@/types/index.js';

export const VERSION = '1.0.0';

export * from '@/types/index.js';

export class LeanCore {
  private ui: UI;
  private aiService: AIService | null = null;
  private outputManager: OutputManager | null = null;

  constructor() {
    this.ui = new UI();
  }

  async initialize(options: ProcessedOptions): Promise<void> {
    try {
      // Load configuration
      const config = await loadConfig(options.config);

      // Apply profile if specified
      const finalConfig = options.profile
        ? { ...config, ...loadProfile(config, options.profile) }
        : config;

      // Override with command line options - create new config object
      const effectiveConfig = {
        ...finalConfig,
        ...(options.creativity !== undefined && { temperature: options.creativity }),
      };

      // Get API key
      const apiKey = getOpenAIApiKey(effectiveConfig, options.env);

      // Initialize services
      this.aiService = new AIService(effectiveConfig, apiKey);
      this.outputManager = new OutputManager(options.output || effectiveConfig.outputDir || '');
    } catch (error) {
      throw new Error(
        `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async executeAction(options: ProcessedOptions): Promise<void> {
    if (!this.aiService || !this.outputManager) {
      throw new Error('LeanCore not initialized');
    }

    if (options.headless && (options.action === 'chat' || options.interactive)) {
      throw new Error('Cannot run chat or interactive mode in headless mode.');
    }

    if (options.headless) {
      await this.executeStandardAction(options);
      return;
    }

    if (options.action === 'chat') {
      await this.startChatSession();
      return;
    }

    // Show the welcome and action header
    this.ui.showWelcome();
    this.ui.showActionHeader(options.action, options.query);

    // Handle interactive mode for non-chat actions
    if (options.interactive) {
      await this.handleInteractiveMode(options);
      return;
    }

    // Standard action execution
    await this.executeStandardAction(options);
  }

  private async executeStandardAction(options: ProcessedOptions): Promise<void> {
    if (!this.aiService || !this.outputManager) return;

    if (options.headless && (options.action === 'chat' || options.interactive)) {
      throw new Error('Cannot run chat or interactive mode in headless mode.');
    }

    const enableUI = !options.headless && !options.interactive;

    if (enableUI) {
      this.ui.startSpinner('Generating response...');
    }

    try {
      const response = await this.aiService.generateResponse(
        options.action,
        options.query,
        options.creativity !== undefined ? { creativity: options.creativity } : {}
      );

      if (enableUI) {
        this.ui.stopSpinner('Response generated!');
      }

      // Show the response with enhanced formatting
      if (enableUI) {
        this.ui.showResponse(response, options.action);
      }

      // Save output if requested
      if (options.output) {
        const outputPath = await this.outputManager.saveResponse(
          options.action,
          options.query,
          response,
          options.output
        );
        if (enableUI) {
          this.ui.showSuccess(`Response saved to: ${outputPath}`);
        }
      }
    } catch (error) {
      if (enableUI) {
        this.ui.failSpinner();
      }
      throw error;
    }
  }

  private async handleInteractiveMode(options: ProcessedOptions): Promise<void> {
    if (!this.aiService || !this.outputManager) return;

    if (options.headless) {
      throw new Error('Cannot run interactive mode in headless mode.');
    }

    this.ui.startSpinner('Generating response...');

    try {
      this.ui.stopSpinner();
      this.ui.startStreaming();

      let fullResponse = '';
      for await (const chunk of this.aiService.streamResponse(
        options.action,
        options.query,
        options.creativity !== undefined ? { creativity: options.creativity } : {}
      )) {
        fullResponse += chunk;
        this.ui.showStreamingResponse(fullResponse);
      }

      this.ui.stopStreaming();

      // Show final formatted response
      this.ui.showResponse(fullResponse, options.action);

      // Save output if requested
      if (options.output) {
        const outputPath = await this.outputManager.saveResponse(
          options.action,
          options.query,
          fullResponse,
          options.output
        );
        this.ui.showSuccess(`Response saved to: ${outputPath}`);
      }
    } catch (error) {
      this.ui.failSpinner();
      throw error;
    }
  }

  private async startChatSession(): Promise<void> {
    if (!this.aiService) return;

    // Ensure no existing UI app interferes with chat input
    this.ui.unmount();
    const chatSession = new ChatSession(this.aiService);
    await chatSession.start();
  }
}

export async function executeLeanAction(options: ProcessedOptions): Promise<void> {
  const lean = new LeanCore();

  try {
    await lean.initialize(options);
    await lean.executeAction(options);
  } catch (error) {
    const ui = new UI();
    ui.showError(error instanceof Error ? error.message : 'An unknown error occurred');
    process.exit(1);
  }
}

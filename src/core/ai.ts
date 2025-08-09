import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { ActionType, ConfigFile, ChatMessage } from '@/types/index.js';
import { getPromptForAction } from '@/prompts/index.js';

export class AIService {
  private config: ConfigFile;
  private apiKey: string;

  constructor(config: ConfigFile, apiKey: string) {
    this.config = config;
    this.apiKey = apiKey;
  }

  async generateResponse(
    action: ActionType,
    query: string,
    options: {
      creativity?: number;
      streaming?: boolean;
    } = {}
  ): Promise<string> {
    const prompt = getPromptForAction(action, query);
    const temperature =
      options.creativity !== undefined ? options.creativity : this.config.temperature;

    // Set API key for this request
    process.env.OPENAI_API_KEY = this.apiKey;
    const model = openai(this.config.model);

    try {
      const result = await generateText({
        model,
        system: prompt.system,
        prompt: prompt.context || query,
        temperature,
        maxTokens: this.config.maxTokens,
      });

      return result.text;
    } catch (error) {
      throw new Error(
        `AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async *streamResponse(
    action: ActionType,
    query: string,
    options: {
      creativity?: number;
    } = {}
  ): AsyncGenerator<string, void, unknown> {
    const prompt = getPromptForAction(action, query);
    const temperature =
      options.creativity !== undefined ? options.creativity : this.config.temperature;

    // Set API key for this request
    process.env.OPENAI_API_KEY = this.apiKey;
    const model = openai(this.config.model);

    try {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await streamText({
        model,
        system: prompt.system,
        prompt: prompt.context || query,
        temperature,
        maxTokens: this.config.maxTokens,
      });

      // eslint-disable-next-line @typescript-eslint/await-thenable
      for await (const delta of result.textStream) {
        yield delta;
      }
    } catch (error) {
      throw new Error(
        `AI streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async chatCompletion(
    messages: ChatMessage[],
    options: {
      creativity?: number;
      streaming?: boolean;
    } = {}
  ): Promise<string> {
    const temperature =
      options.creativity !== undefined ? options.creativity : this.config.temperature;

    // Set API key for this request
    process.env.OPENAI_API_KEY = this.apiKey;
    const model = openai(this.config.model);

    try {
      const result = await generateText({
        model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature,
        maxTokens: this.config.maxTokens,
      });

      return result.text;
    } catch (error) {
      throw new Error(
        `Chat completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async *streamChatCompletion(
    messages: ChatMessage[],
    options: {
      creativity?: number;
    } = {}
  ): AsyncGenerator<string, void, unknown> {
    const temperature =
      options.creativity !== undefined ? options.creativity : this.config.temperature;

    // Set API key for this request
    process.env.OPENAI_API_KEY = this.apiKey;
    const model = openai(this.config.model);

    try {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await streamText({
        model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature,
        maxTokens: this.config.maxTokens,
      });

      // eslint-disable-next-line @typescript-eslint/await-thenable
      for await (const delta of result.textStream) {
        yield delta;
      }
    } catch (error) {
      throw new Error(
        `Chat streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

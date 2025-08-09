export interface LearnConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  outputDir?: string;
}

export interface ActionOptions {
  topic?: string;
  env?: string;
  config?: string;
  setupConfig?: boolean;
  input?: string;
  profile?: string;
  creativity?: number;
  interactive?: boolean;
  output?: string;
  // Global action shortcuts
  ask?: string;
  analyze?: string;
  explain?: string;
  teach?: string;
  chat?: string;
}

export type ActionType = 'analyze' | 'ask' | 'explain' | 'teach' | 'chat';

export interface ProcessedOptions extends ActionOptions {
  action: ActionType;
  query: string;
  headless?: boolean;
}

export interface ConfigFile {
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  outputDir: string;
  profiles?: Record<string, Partial<LearnConfig>>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ActionPrompts {
  system: string;
  context?: string;
}

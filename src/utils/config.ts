import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { ConfigFile, LearnConfig } from '@/types/index.js';
import chalk from 'chalk';
import inquirer from 'inquirer';

const CONFIG_DIR = path.join(os.homedir(), '.lean');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export const DEFAULT_CONFIG: ConfigFile = {
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 4000,
  outputDir: path.join(os.homedir(), '.lean', 'outputs'),
};

export async function ensureConfigDir(): Promise<void> {
  try {
    await fs.access(CONFIG_DIR);
  } catch {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  }
}

export async function loadConfig(customConfigPath?: string): Promise<ConfigFile> {
  const configPath = customConfigPath || CONFIG_FILE;

  try {
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent) as ConfigFile;
    return { ...DEFAULT_CONFIG, ...config };
  } catch {
    // If config doesn't exist, create it with defaults
    if (!customConfigPath) {
      await saveConfig(DEFAULT_CONFIG);
    }
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(config: ConfigFile, customConfigPath?: string): Promise<void> {
  await ensureConfigDir();
  const configPath = customConfigPath || CONFIG_FILE;
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

export async function setupInteractiveConfig(): Promise<ConfigFile> {
  console.log(chalk.cyan.bold('\n🚀 Setting up Lean configuration\n'));

  const questions = [
    {
      type: 'input',
      name: 'apiKey',
      message: 'Enter your OpenAI API key:',
      validate: (input: string) => input.length > 0 || 'API key is required',
    },
    {
      type: 'list',
      name: 'model',
      message: 'Choose your preferred model:',
      choices: [
        // gpt 4.1\
        { name: 'GPT-5', value: 'gpt-5' },
        { name: 'GPT-5 mini', value: 'gpt-5-mini' },
        { name: 'GPT-5 nano', value: 'gpt-5-nano' },
        { name: 'GPT-4.1', value: 'gpt-4.1' },
        { name: 'GPT-4.1 mini', value: 'gpt-4.1-mini' },
        { name: 'GPT-4.1 nano', value: 'gpt-4.1-nano' },
        { name: 'GPT-4o (Recommended)', value: 'gpt-4o' },
        { name: 'GPT-4o mini', value: 'gpt-4o-mini' },
        { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
        { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
      ],
      default: 'gpt-4.1-mini',
    },
    {
      type: 'input',
      name: 'temperature',
      message: 'Set temperature (0.0-2.0, lower = more focused):',
      default: '0.7',
      validate: (input: string) => {
        const num = parseFloat(input);
        return (!isNaN(num) && num >= 0 && num <= 2) || 'Temperature must be between 0 and 2';
      },
      filter: (input: string) => parseFloat(input),
    },
    {
      type: 'input',
      name: 'maxTokens',
      message: 'Set max tokens per response:',
      default: '4096',
      validate: (input: string) => {
        const num = parseInt(input);
        return (!isNaN(num) && num > 0) || 'Max tokens must be positive';
      },
      filter: (input: string) => parseInt(input),
    },
    {
      type: 'input',
      name: 'outputDir',
      message: 'Set output directory for saved responses:',
      default: DEFAULT_CONFIG.outputDir,
    },
  ];

  // Use any type to avoid TypeScript issues with inquirer versions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const answers: any = await (inquirer as any).prompt(questions);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const config: ConfigFile = {
    ...DEFAULT_CONFIG,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    ...answers,
  };

  await saveConfig(config);
  console.log(chalk.green.bold('\n✅ Configuration saved successfully!'));

  return config;
}

export function loadProfile(config: ConfigFile, profileName: string): LearnConfig {
  if (!config.profiles?.[profileName]) {
    throw new Error(`Profile "${profileName}" not found`);
  }

  return {
    ...config,
    ...config.profiles[profileName],
  };
}

export function getOpenAIApiKey(config: ConfigFile, envFile?: string): string {
  // Check custom env file first
  if (envFile) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const envConfig = require('dotenv').config({ path: envFile });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
    if (envConfig.parsed?.OPENAI_API_KEY) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
      return envConfig.parsed.OPENAI_API_KEY;
    }
  }

  // Check environment variable
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  // Check config file
  if (config.apiKey) {
    return config.apiKey;
  }

  throw new Error(
    'OpenAI API key not found. Please set OPENAI_API_KEY environment variable or run: lean --setup-config'
  );
}

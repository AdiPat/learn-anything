#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import { VERSION, learnTopic, LearnOptions } from '@/index.js';

dotenv.config();

const program = new Command();

program
  .version(VERSION)
  .description('Learn anything with AI!')
  .requiredOption('-t, --topic <topic>', 'Topic to learn about')
  .option('-m, --model <model>', 'AI model to use', 'gpt-4o')
  .option('--temperature <temp>', 'Temperature for AI responses', '0.7')
  .option('-o, --output <file>', 'Output file path')
  .option('--chat', 'Enable interactive chat mode')
  .option('--disable-console', 'Disable console output')
  .action(async (options: LearnOptions) => {
    await learnTopic(options);
  });

program.parse(process.argv);

import chalk from 'chalk';
import boxen from 'boxen';
import gradient from 'gradient-string';
import ora, { Ora } from 'ora';
import wrapAnsi from 'wrap-ansi';

import terminalLink from 'terminal-link';
import { ActionType } from '@/types/index.js';

export class UI {
  private spinner: Ora | null = null;
  private isStreaming: boolean = false;

  constructor() {
    // Initialize any UI state if needed
  }

  public showWelcome(): void {
    const title = gradient.cristal('🧠 LEAN - Learn Anything');
    const subtitle = chalk.gray('Powered by AI • Learn anything, anytime');
    const version = chalk.gray('v1.0.0');

    const welcomeContent = `${title}\n${subtitle}\n${version}`;

    const welcomeBox = boxen(welcomeContent, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      backgroundColor: '#0a0a0a',
      textAlignment: 'center',
    });

    console.log(welcomeBox);
  }

  public showActionHeader(action: ActionType, query: string): void {
    const actionConfig = {
      analyze: { emoji: '🔍', color: 'magenta', label: 'ANALYZE' },
      ask: { emoji: '💭', color: 'blue', label: 'ASK' },
      explain: { emoji: '📚', color: 'green', label: 'EXPLAIN' },
      teach: { emoji: '🎓', color: 'yellow', label: 'TEACH' },
      chat: { emoji: '💬', color: 'cyan', label: 'CHAT' },
    } as const;

    const config = actionConfig[action] || actionConfig.ask;
    const colorFn = chalk[config.color as keyof typeof chalk] as any;

    console.log();
    console.log(
      `${config.emoji} ${colorFn.bold(config.label)} ${chalk.gray('•')} ${chalk.white(query)}`
    );
    console.log(chalk.gray('─'.repeat(Math.min(process.stdout.columns - 4, 80))));
    console.log();
  }

  public startSpinner(text: string = 'Loading...'): void {
    if (this.spinner) {
      this.spinner.stop();
    }
    this.spinner = ora({
      text: chalk.cyan(text),
      color: 'cyan',
      spinner: 'dots12',
    }).start();
  }

  public updateSpinner(text: string): void {
    if (this.spinner) {
      this.spinner.text = chalk.cyan(text);
    }
  }

  public stopSpinner(message?: string): void {
    if (this.spinner) {
      if (message) {
        this.spinner.succeed(chalk.green(message));
      } else {
        this.spinner.stop();
      }
      this.spinner = null;
    }
  }

  public failSpinner(message?: string): void {
    if (this.spinner) {
      if (message) {
        this.spinner.fail(chalk.red(message));
      } else {
        this.spinner.fail(chalk.red('Operation failed'));
      }
      this.spinner = null;
    }
  }

  public showResponse(content: string, _action: ActionType): void {
    console.log();

    // Format the markdown content for terminal display
    const formattedContent = this.formatMarkdown(content);

    const responseBox = boxen(formattedContent, {
      padding: 1,
      margin: 1,
      borderStyle: 'single',
      borderColor: 'blue',
      backgroundColor: '#001122',
      width: Math.min(process.stdout.columns - 4, 100),
    });

    console.log(responseBox);
    console.log();
  }

  public startStreaming(): void {
    this.isStreaming = true;
    console.log();
    console.log(chalk.cyan('🔄 Streaming response...'));
    console.log();
  }

  public showStreamingResponse(content: string): void {
    if (!this.isStreaming) return;

    // Clear the previous streaming output and show updated content
    process.stdout.write('\x1b[2J\x1b[0f'); // Clear screen

    const formattedContent = this.formatMarkdown(content);
    console.log(chalk.blue('📝 Response:'));
    console.log();
    console.log(formattedContent);
    console.log();
    console.log(chalk.gray('─'.repeat(Math.min(process.stdout.columns - 4, 60))));
    console.log(chalk.yellow('⏳ Still generating...'));
  }

  public stopStreaming(): void {
    this.isStreaming = false;
  }

  public showError(message: string): void {
    const errorBox = boxen(
      `${chalk.red.bold('❌ Error')}\n\n${chalk.red(message)}\n\n${chalk.gray('Please check your configuration and try again.')}`,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'red',
        backgroundColor: '#220000',
      }
    );

    console.error(errorBox);
  }

  public showSuccess(message: string): void {
    const successBox = boxen(`${chalk.green.bold('✅ Success')}\n\n${chalk.green(message)}`, {
      padding: 1,
      margin: 1,
      borderStyle: 'single',
      borderColor: 'green',
      backgroundColor: '#002200',
    });

    console.log(successBox);
  }

  public showInfo(title: string, content: string): void {
    const infoBox = boxen(`${chalk.blue.bold(`ℹ️  ${title}`)}\n\n${chalk.white(content)}`, {
      padding: 1,
      margin: 1,
      borderStyle: 'single',
      borderColor: 'blue',
      backgroundColor: '#000022',
    });

    console.log(infoBox);
  }

  public unmount(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
    this.isStreaming = false;
  }

  private formatMarkdown(content: string): string {
    const lines = content.split('\n');
    const formattedLines: string[] = [];

    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] || '';

      // Code blocks
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        formattedLines.push(chalk.gray(line));
        continue;
      }

      if (inCodeBlock) {
        formattedLines.push(chalk.green(line));
        continue;
      }

      // Headers
      if (line.startsWith('# ')) {
        formattedLines.push(chalk.green.bold.underline(line.substring(2)));
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

      // Links (simple pattern)
      processedLine = processedLine.replace(/\[(.+?)\]\((.+?)\)/g, (_, text, url) => {
        return terminalLink(chalk.blue.underline(text), url, {
          fallback: () => `${chalk.blue.underline(text)} (${chalk.gray(url)})`,
        });
      });

      // Wrap long lines
      if (processedLine.length > 0) {
        const wrapped = wrapAnsi(processedLine, Math.min(process.stdout.columns - 8, 92), {
          trim: false,
          hard: true,
        });
        formattedLines.push(wrapped);
      } else {
        formattedLines.push('');
      }
    }

    return formattedLines.join('\n');
  }
}

import chalk from 'chalk';
import ora, { Ora } from 'ora';
import boxen from 'boxen';
import gradient from 'gradient-string';

export class UIManager {
  private spinner: Ora | null = null;

  public showWelcome(): void {
    const title = gradient.cristal('LEAN - Learn Anything');
    const subtitle = chalk.gray('Powered by AI • Learn anything, anytime');

    console.log(
      boxen(`${title}\n${subtitle}`, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        backgroundColor: '#1a1a1a',
      })
    );
  }

  public startSpinner(text: string): void {
    this.spinner = ora({
      text: chalk.cyan(text),
      spinner: 'dots12',
      color: 'cyan',
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
      this.spinner.fail(chalk.red(message || 'Operation failed'));
      this.spinner = null;
    }
  }

  public showError(error: string): void {
    console.log(
      '\n' +
        boxen(chalk.red.bold('❌ Error\n\n') + chalk.white(error), {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'red',
        })
    );
  }

  public showSuccess(message: string): void {
    console.log(
      '\n' +
        boxen(chalk.green.bold('✅ Success\n\n') + chalk.white(message), {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'green',
        })
    );
  }

  public showInfo(title: string, content: string): void {
    console.log(
      '\n' +
        boxen(chalk.blue.bold(`ℹ️  ${title}\n\n`) + chalk.white(content), {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'blue',
        })
    );
  }

  public formatAction(action: string): string {
    const actionColors = {
      analyze: chalk.magenta.bold,
      ask: chalk.blue.bold,
      explain: chalk.green.bold,
      teach: chalk.yellow.bold,
      chat: chalk.cyan.bold,
    };

    const formatter = actionColors[action as keyof typeof actionColors] || chalk.white.bold;
    return formatter(action.toUpperCase());
  }

  public formatResponse(content: string, _action: string): string {
    const lines = content.split('\n');
    const formatted = lines.map((line) => {
      if (line.startsWith('#')) {
        return chalk.bold.cyan(line);
      } else if (line.startsWith('##')) {
        return chalk.bold.blue(line);
      } else if (line.startsWith('###')) {
        return chalk.bold.green(line);
      } else if (line.startsWith('-') || line.startsWith('*')) {
        return chalk.yellow(line);
      } else if (line.includes('```')) {
        return chalk.gray(line);
      }
      return line;
    });

    return formatted.join('\n');
  }

  public showTypingAnimation(text: string, delay: number = 30): Promise<void> {
    return new Promise((resolve) => {
      let i = 0;
      const timer = setInterval(() => {
        const char = text[i];
        if (char !== undefined) {
          process.stdout.write(char);
        }
        i++;
        if (i >= text.length) {
          clearInterval(timer);
          console.log(); // New line
          resolve();
        }
      }, delay);
    });
  }
}

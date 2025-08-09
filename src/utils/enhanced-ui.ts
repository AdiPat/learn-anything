import chalk from 'chalk';
import ora, { Ora } from 'ora';
import boxen from 'boxen';
import gradient from 'gradient-string';

// Enhanced UI Manager that combines the best of both approaches
export class EnhancedUIManager {
  private spinner: Ora | null = null;

  public showWelcome(): void {
    const title = gradient.cristal('🧠 LEAN - Learn Anything');
    const subtitle = chalk.gray('Powered by AI • Learn anything, anytime • v1.0.0');

    // Claude Code-like styling
    const welcome = boxen(`${title}\n${subtitle}`, {
      padding: 1,
      margin: { top: 1, bottom: 1, left: 2, right: 2 },
      borderStyle: 'round',
      borderColor: 'cyan',
      backgroundColor: '#0a0a0a',
      textAlignment: 'center',
    });

    console.log(welcome);
  }

  public showActionHeader(action: string, query: string): void {
    const actionConfig = {
      analyze: { emoji: '🔍', color: chalk.magenta, label: 'ANALYZE' },
      ask: { emoji: '💭', color: chalk.blue, label: 'ASK' },
      explain: { emoji: '📚', color: chalk.green, label: 'EXPLAIN' },
      teach: { emoji: '🎓', color: chalk.yellow, label: 'TEACH' },
      chat: { emoji: '💬', color: chalk.cyan, label: 'CHAT' },
    } as const;

    const config = actionConfig[action as keyof typeof actionConfig] || actionConfig.ask;

    console.log(
      '\n' + config.emoji + ' ' + config.color.bold(config.label) + chalk.gray(' • ') + query
    );
    console.log(chalk.gray('─'.repeat(Math.min(process.stdout.columns - 4, 80))));
  }

  public startSpinner(text: string): void {
    // Add a little vertical spacing and a pleasant spinner with prefix
    console.log('');
    this.spinner = ora({
      text: chalk.cyan(text),
      spinner: 'dots12',
      color: 'cyan',
      prefixText: chalk.gray('🤖'),
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
      console.log('');
    }
  }

  public failSpinner(message?: string): void {
    if (this.spinner) {
      this.spinner.fail(chalk.red(message || 'Operation failed'));
      this.spinner = null;
      console.log('');
    }
  }

  public showResponse(content: string, _action: string): void {
    console.log('\n' + chalk.green.bold('🤖 Assistant') + chalk.gray.dim(' • completed'));
    console.log('');

    // Enhanced markdown formatting
    const formatted = this.formatMarkdown(content);

    // Wrap in a subtle box for Claude-like appearance
    const response = boxen(formatted, {
      padding: { top: 0, bottom: 0, left: 2, right: 2 },
      borderStyle: 'single',
      borderColor: 'gray',
      backgroundColor: '#0a0a0a',
    });

    console.log(response);
  }

  public showStreamingResponse(content: string): void {
    // Clear the line and show content with cursor
    process.stdout.write('\r\x1b[K' + content + chalk.cyan.dim('▋'));
  }

  public startStreaming(): void {
    // Initialize streaming mode - header is handled by the chat session
  }

  public stopStreaming(): void {
    // Clean up streaming mode
  }

  public showError(error: string): void {
    const errorBox = boxen(
      chalk.red.bold('❌ Error\n\n') +
        chalk.white(error) +
        '\n\n' +
        chalk.yellow.bold('💡 Suggestion: ') +
        chalk.gray('Please check your configuration and try again.'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'red',
        backgroundColor: '#0a0a0a',
      }
    );
    console.log(errorBox);
  }

  public showSuccess(message: string): void {
    const successBox = boxen(chalk.green.bold('✅ Success\n\n') + chalk.white(message), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'green',
      backgroundColor: '#0a0a0a',
    });
    console.log(successBox);
  }

  public showInfo(title: string, content: string): void {
    const infoBox = boxen(chalk.blue.bold(`ℹ️  ${title}\n\n`) + chalk.white(content), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'blue',
      backgroundColor: '#0a0a0a',
    });
    console.log(infoBox);
  }

  private applyInlineFormatting(input: string): string {
    let line = input;
    // Apply TeX beautification even when not explicitly in \( \)
    line = this.beautifyTeX(line);
    // Bold **text**
    line = line.replace(/\*\*(.+?)\*\*/g, (_, text) => chalk.bold(text));
    // Italic *text*
    line = line.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, (_, text) => chalk.italic(text));
    // Inline code `code`
    line = line.replace(/`(.+?)`/g, (_, code) => chalk.black.bgYellow(` ${code} `));
    // Links [text](url) -> underline text
    line = line.replace(/\[(.+?)\]\((.+?)\)/g, (_, text) => chalk.underline(text));
    // Simple emphasis for underscores
    line = line.replace(/__(.+?)__/g, (_, text) => chalk.bold.underline(text));
    return line;
  }

  private formatCodeBlock(language: string | undefined, code: string): string {
    const lines = code.replace(/\n$/, '').split('\n');
    const highlightPython = (l: string): string => {
      // Very lightweight highlighting
      const keywords =
        /\b(def|class|return|if|elif|else|for|while|in|import|from|as|try|except|with|lambda|True|False|None)\b/g;
      const numbers = /\b\d+(?:\.\d+)?\b/g;
      const strings = /(["'])(?:(?=(\\?))\2.)*?\1/g;
      let out = l.replace(strings, (m) => chalk.green(m));
      out = out.replace(keywords, (m) => chalk.cyan(m));
      out = out.replace(numbers, (m) => chalk.yellow(m));
      return out;
    };

    const highlighter = (l: string) => {
      if (!language) return chalk.gray(l);
      const lang = language.toLowerCase();
      if (lang === 'py' || lang === 'python') return highlightPython(l);
      // Default: dim/gray
      return chalk.gray(l);
    };

    const formatted = lines.map((l) => '  ' + highlighter(l)).join('\n');
    // Subtle inner box feel using a faint border (just indentation)
    return chalk.gray('') + formatted;
  }

  private formatMath(content: string): string {
    // Replace LaTeX tokens with unicode equivalents and colorize
    const beautified = this.beautifyTeX(content);
    return beautified
      .split('\n')
      .map((l) => chalk.magenta(l))
      .join('\n');
  }

  // Convert common LaTeX math commands to nicer unicode/ASCII forms
  private beautifyTeX(input: string): string {
    let s = input;

    // Remove spacing and delimiter helpers
    s = s.replace(/\\left\s*/g, '').replace(/\\right\s*/g, '');

    // Remove font commands but keep content
    s = s.replace(/\\(mathbf|mathrm|mathit|mathsf|mathcal|mathbb|boldsymbol)\s*\{([^}]+)\}/g, '$2');

    // Handle nested \frac{a}{b} recursively
    for (let i = 0; i < 10; i++) {
      const prev = s;
      s = s.replace(
        /\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g,
        (_m, a: string, b: string) => `(${a})/(${b})`
      );
      if (s === prev) break;
    }

    // \sqrt[n]{x} and \sqrt{x}
    s = s.replace(
      /\\sqrt\s*\[([^\]]+)\]\s*\{([^}]+)\}/g,
      (_m, n: string, a: string) => `√[${n}](${a})`
    );
    s = s.replace(/\\sqrt\s*\{([^}]+)\}/g, (_m, a: string) => `√(${a})`);

    // Limits for sum, int, lim: keep as symbol with _{lower}^{upper}
    s = s.replace(
      /\\sum\s*(?:_\{([^}]*)\})?(?:\^\{([^}]*)\})?/g,
      (_m, low?: string, up?: string) => `∑${low ? `_${low}` : ''}${up ? `^${up}` : ''}`
    );
    s = s.replace(
      /\\int\s*(?:_\{([^}]*)\})?(?:\^\{([^}]*)\})?/g,
      (_m, low?: string, up?: string) => `∫${low ? `_${low}` : ''}${up ? `^${up}` : ''}`
    );
    s = s.replace(/\\lim\s*(?:_\{([^}]*)\})?/g, (_m, low?: string) => `lim${low ? `_${low}` : ''}`);

    // Greek letters (lowercase and uppercase selection)
    const greek: [RegExp, string][] = [
      [/\\alpha/g, 'α'],
      [/\\beta/g, 'β'],
      [/\\gamma/g, 'γ'],
      [/\\delta/g, 'δ'],
      [/\\epsilon/g, 'ε'],
      [/\\zeta/g, 'ζ'],
      [/\\eta/g, 'η'],
      [/\\theta/g, 'θ'],
      [/\\iota/g, 'ι'],
      [/\\kappa/g, 'κ'],
      [/\\lambda/g, 'λ'],
      [/\\mu/g, 'μ'],
      [/\\nu/g, 'ν'],
      [/\\xi/g, 'ξ'],
      [/\\pi/g, 'π'],
      [/\\rho/g, 'ρ'],
      [/\\sigma/g, 'σ'],
      [/\\tau/g, 'τ'],
      [/\\upsilon/g, 'υ'],
      [/\\phi/g, 'φ'],
      [/\\chi/g, 'χ'],
      [/\\psi/g, 'ψ'],
      [/\\omega/g, 'ω'],
      [/\\Gamma/g, 'Γ'],
      [/\\Delta/g, 'Δ'],
      [/\\Theta/g, 'Θ'],
      [/\\Lambda/g, 'Λ'],
      [/\\Xi/g, 'Ξ'],
      [/\\Pi/g, 'Π'],
      [/\\Sigma/g, 'Σ'],
      [/\\Upsilon/g, 'Υ'],
      [/\\Phi/g, 'Φ'],
      [/\\Psi/g, 'Ψ'],
      [/\\Omega/g, 'Ω'],
    ];
    for (const [re, rep] of greek) s = s.replace(re, rep);

    // Common math operators/symbols
    const ops: [RegExp, string][] = [
      [/\\cdot/g, '·'],
      [/\\times/g, '×'],
      [/\\pm/g, '±'],
      [/\\mp/g, '∓'],
      [/\\leq/g, '≤'],
      [/\\geq/g, '≥'],
      [/\\neq/g, '≠'],
      [/\\approx/g, '≈'],
      [/\\sim/g, '∼'],
      [/\\propto/g, '∝'],
      [/\\infty/g, '∞'],
      [/\\partial/g, '∂'],
      [/\\nabla/g, '∇'],
      [/\\hbar/g, 'ħ'],
      [/\\to/g, '→'],
      [/\\rightarrow/g, '→'],
      [/\\leftarrow/g, '←'],
      [/\\Rightarrow/g, '⇒'],
      [/\\Leftarrow/g, '⇐'],
      [/\\cdots/g, '⋯'],
      [/\\ldots/g, '…'],
    ];
    for (const [re, rep] of ops) s = s.replace(re, rep);

    // Accents and vectors
    s = s.replace(/\\hat\s*\{([^}])\}/g, (_m, a: string) => `${a}\u0302`);
    s = s.replace(/\\bar\s*\{([^}]+)\}/g, (_m, a: string) =>
      a
        .split('')
        .map((ch: string) => ch + '\u0305')
        .join('')
    );
    s = s.replace(/\\overline\s*\{([^}]+)\}/g, (_m, a: string) =>
      a
        .split('')
        .map((ch: string) => ch + '\u0305')
        .join('')
    );
    s = s.replace(/\\underline\s*\{([^}]+)\}/g, (_m, a: string) =>
      a
        .split('')
        .map((ch: string) => ch + '\u0332')
        .join('')
    );
    s = s.replace(/\\vec\s*\{([^}])\}/g, (_m, a: string) => `${a}\u20d7`);

    // \frac already handled; superscripts/subscripts
    const superMap: Record<string, string> = {
      '0': '⁰',
      '1': '¹',
      '2': '²',
      '3': '³',
      '4': '⁴',
      '5': '⁵',
      '6': '⁶',
      '7': '⁷',
      '8': '⁸',
      '9': '⁹',
      '+': '⁺',
      '-': '⁻',
      '=': '⁼',
      '(': '⁽',
      ')': '⁾',
    };
    const subMap: Record<string, string> = {
      '0': '₀',
      '1': '₁',
      '2': '₂',
      '3': '₃',
      '4': '₄',
      '5': '₅',
      '6': '₆',
      '7': '₇',
      '8': '₈',
      '9': '₉',
      '+': '₊',
      '-': '₋',
      '=': '₌',
      '(': '₍',
      ')': '₎',
    };
    const toSuper = (t: string) =>
      t
        .split('')
        .map((ch) => superMap[ch] || ch)
        .join('');
    const toSub = (t: string) =>
      t
        .split('')
        .map((ch) => subMap[ch] || ch)
        .join('');

    // x^{...} and x^n
    s = s.replace(/\^\{([^}]+)\}/g, (_m, t: string) => toSuper(t));
    s = s.replace(/\^(\d+)/g, (_m, t: string) => toSuper(t));
    // x_{...} and x_n
    s = s.replace(/_\{([^}]+)\}/g, (_m, t: string) => toSub(t));
    s = s.replace(/_(\d+)/g, (_m, t: string) => toSub(t));

    return s;
  }

  // Render matrix environments (pmatrix, bmatrix, vmatrix, etc.)
  private renderMatrix(type: string, content: string): string {
    const rows = content
      .split(/\\\\/g)
      .map((r) => r.trim())
      .filter((r) => r.length > 0)
      .map((r) => r.split(/\s*&\s*/g).map((c) => this.beautifyTeX(c.trim())));

    // Compute column widths
    const colCount = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const widths: number[] = new Array(colCount).fill(0);
    for (const r of rows) {
      for (let i = 0; i < colCount; i++) {
        const cell = (r[i] ?? '') as string;
        const current = widths[i] ?? 0;
        widths[i] = Math.max(current, cell.length, 1);
      }
    }

    const padCell = (s: string, w: number) => s + ' '.repeat(Math.max(0, w - s.length));

    const wrap = (line: string): string => {
      switch (type) {
        case 'pmatrix':
          return chalk.magenta('(') + line + chalk.magenta(')');
        case 'bmatrix':
          return chalk.magenta('[') + line + chalk.magenta(']');
        case 'Bmatrix':
          return chalk.magenta('{') + line + chalk.magenta('}');
        case 'vmatrix':
          return chalk.magenta('|') + line + chalk.magenta('|');
        case 'Vmatrix':
          return chalk.magenta('||') + line + chalk.magenta('||');
        default:
          return '  ' + line + '  ';
      }
    };

    const lines = rows.map((r) => {
      const cells = new Array(colCount).fill('');
      for (let i = 0; i < colCount; i++) cells[i] = padCell(r[i] || '', widths[i] ?? 0);
      return wrap(cells.join('  '));
    });

    return lines.join('\n');
  }

  public formatMarkdown(content: string): string {
    const lines = content.split('\n');
    const out: string[] = [];

    let inCode = false;
    let codeLang: string | undefined;
    let codeBuffer: string[] = [];

    let inMathBlock = false;
    let mathBuffer: string[] = [];

    let inMatrix = false;
    let matrixType: string | null = null;
    let matrixBuffer: string[] = [];

    for (let raw of lines) {
      const line = raw;

      // Code block fences
      if (line.trim().startsWith('```')) {
        if (!inCode) {
          inCode = true;
          codeLang = line.trim().substring(3).trim() || undefined;
          codeBuffer = [];
        } else {
          // closing fence
          const formattedCode = this.formatCodeBlock(codeLang, codeBuffer.join('\n'));
          out.push(formattedCode);
          inCode = false;
          codeLang = undefined;
          codeBuffer = [];
        }
        continue;
      }

      if (inCode) {
        codeBuffer.push(line);
        continue;
      }

      // Matrix environments
      const beginMatrix = line.match(/\\begin\{(pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix|matrix)\}/);
      if (beginMatrix && !inMatrix) {
        inMatrix = true;
        matrixType = (beginMatrix[1] as string) || null;
        matrixBuffer = [];
        continue;
      }
      if (inMatrix) {
        const endMatch = line.match(/\\end\{(pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix|matrix)\}/);
        if (endMatch) {
          const rendered = this.renderMatrix(matrixType || 'matrix', matrixBuffer.join(' '));
          out.push(rendered);
          inMatrix = false;
          matrixType = null;
          matrixBuffer = [];
          continue;
        } else {
          matrixBuffer.push(line);
          continue;
        }
      }

      // Math blocks using \[ ... \]
      if (line.trim() === '\\[') {
        inMathBlock = true;
        mathBuffer = [];
        continue;
      }
      if (line.trim() === '\\]') {
        const mathJoined = mathBuffer.join('\n');
        out.push(this.formatMath(mathJoined));
        inMathBlock = false;
        mathBuffer = [];
        continue;
      }
      if (inMathBlock) {
        mathBuffer.push(line);
        continue;
      }

      // Headers
      if (line.startsWith('# ')) {
        out.push(chalk.green.bold.underline(line.substring(2)));
        continue;
      }
      if (line.startsWith('## ')) {
        out.push(chalk.cyan.bold(line.substring(3)));
        continue;
      }
      if (line.startsWith('### ')) {
        out.push(chalk.blue.bold(line.substring(4)));
        continue;
      }

      // Lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const body = this.applyInlineFormatting(line.substring(2));
        out.push(chalk.yellow('• ') + body);
        continue;
      }

      // Numbered lists
      if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^(\d+)\.\s(.+)$/);
        if (match && match[1] && match[2]) {
          const body = this.applyInlineFormatting(match[2]);
          out.push(chalk.cyan.bold(match[1] + '. ') + body);
          continue;
        }
      }

      // Inline math \( ... \)
      if (line.includes('\\(') && line.includes('\\)')) {
        const inlineMath = line.replace(/\\\((.+?)\\\)/g, (_m, expr) => this.formatMath(expr));
        out.push(this.applyInlineFormatting(inlineMath));
        continue;
      }

      // Default: apply inline formatting
      out.push(this.applyInlineFormatting(line));
    }

    // If an unterminated code or math block sneaks through, flush it
    if (inCode && codeBuffer.length) {
      out.push(this.formatCodeBlock(codeLang, codeBuffer.join('\n')));
    }
    if (inMathBlock && mathBuffer.length) {
      out.push(this.formatMath(mathBuffer.join('\n')));
    }
    if (inMatrix && matrixBuffer.length) {
      out.push(this.renderMatrix(matrixType || 'matrix', matrixBuffer.join(' ')));
    }

    return out.join('\n');
  }

  // Legacy compatibility methods
  public formatAction(action: string): string {
    return action.toUpperCase();
  }

  public formatResponse(content: string, _action: string): string {
    return this.formatMarkdown(content);
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

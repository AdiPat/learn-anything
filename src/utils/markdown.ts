// src/utils/markdown.ts
import chalk from 'chalk';
import boxen from 'boxen';

export class MarkdownFormatter {
  private static footnotes: Map<string, string> = new Map();

  static format(text: string): string {
    // Reset footnotes for each format call
    this.footnotes.clear();

    let formatted = text
      // 1. Escape and protect content (must be first)
      .replace(/\\(.)/g, (_, char) => `__ESCAPED_${char.charCodeAt(0)}__`)

      // 2. Code blocks (protect from other formatting)
      .replace(/```(\w+)?\s*\n([\s\S]*?)```/g, (_, lang, code) => this.formatCodeBlock(code, lang))

      // 3. Tables (before other formatting)
      .replace(/^\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm, (_match, header, rows) =>
        this.formatTable(header, rows)
      )

      // 4. Math expressions (LaTeX) - support $$...$$, \[...\], and \(...\)
      .replace(/\$\$\s*\n?([\s\S]*?)\n?\s*\$\$/g, (_, math) => this.formatMathBlock(math.trim()))
      .replace(/\\\[\s*\n?([\s\S]*?)\n?\s*\\\]/g, (_, math) => this.formatMathBlock(math.trim()))
      .replace(/\\\((.+?)\\\)/g, (_, math) => this.formatInlineMath(math.trim()))
      .replace(/\$([^$\n\r]+?)\$/g, (_, math) => this.formatInlineMath(math.trim()))

      // 5. Headers (all levels with proper hierarchy)
      .replace(/^#{6}\s+(.+?)(?:\s+#{6})?$/gm, (_, title) =>
        chalk.gray.dim(`      ${chalk.gray('◦')} ${title.trim()}`)
      )
      .replace(/^#{5}\s+(.+?)(?:\s+#{5})?$/gm, (_, title) =>
        chalk.gray(`    ${chalk.gray('▫')} ${title.trim()}`)
      )
      .replace(/^#{4}\s+(.+?)(?:\s+#{4})?$/gm, (_, title) =>
        chalk.blue(`  ${chalk.blue('▪')} ${title.trim()}`)
      )
      .replace(/^#{3}\s+(.+?)(?:\s+#{3})?$/gm, (_, title) =>
        chalk.blue.bold(`\n${chalk.blue('▸')} ${title.trim()}\n`)
      )
      .replace(/^#{2}\s+(.+?)(?:\s+#{2})?$/gm, (_, title) => {
        const cleanTitle = title.trim();
        return chalk.cyan.bold(
          `\n${cleanTitle}\n${chalk.cyan('─'.repeat(Math.min(cleanTitle.length, 50)))}\n`
        );
      })
      .replace(/^#{1}\s+(.+?)(?:\s+#{1})?$/gm, (_, title) => {
        const cleanTitle = title.trim().toUpperCase();
        return chalk.green.bold.underline(
          `\n${cleanTitle}\n${chalk.green('═'.repeat(Math.min(cleanTitle.length, 50)))}\n`
        );
      })

      // 6. Horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, () => chalk.gray(`\n${'─'.repeat(60)}\n`))

      // 7. Text formatting (order is crucial)
      .replace(/~~(.+?)~~/g, (_, text) => chalk.strikethrough(text))
      .replace(/\*{3}(.+?)\*{3}/g, (_, text) => chalk.bold.italic(text))
      .replace(/_{3}(.+?)_{3}/g, (_, text) => chalk.bold.italic(text))
      .replace(/\*{2}(.+?)\*{2}/g, (_, text) => chalk.bold(text))
      .replace(/_{2}(.+?)_{2}/g, (_, text) => chalk.bold(text))
      .replace(/\*(.+?)\*/g, (_, text) => chalk.italic(text))
      .replace(/_(.+?)_/g, (_, text) => chalk.italic(text))

      // 8. Links and images (before code to avoid conflicts)
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => this.formatImage(alt, url))
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => this.formatLink(text, url))
      .replace(/\[([^\]]+)\]\[([^\]]+)\]/g, (_, text, ref) => this.formatRefLink(text, ref))
      .replace(/<(https?:\/\/[^>]+)>/g, (_, url) => chalk.blue.underline(url))

      // 9. Inline code (after links)
      .replace(/`([^`\n\r]+?)`/g, (_, code) => chalk.black.bgYellow(` ${code} `))

      // 10. Task lists (with better icons)
      .replace(
        /^(\s*)- \[x\]\s+(.+)$/gim,
        (_, indent, task) => `${indent}${chalk.green('✅')} ${chalk.strikethrough.gray(task)}`
      )
      .replace(
        /^(\s*)- \[ \]\s+(.+)$/gim,
        (_, indent, task) => `${indent}${chalk.gray('⬜')} ${task}`
      )

      // 11. Lists (various types with proper indentation)
      .replace(
        /^(\s*)(\d+)\.\s+(.+)$/gm,
        (_, indent, num, item) => `${indent}${chalk.cyan.bold(`${num}.`)} ${item}`
      )
      .replace(/^(\s*)[-+*]\s+(.+)$/gm, (_, indent, item) => `${indent}${chalk.gray('•')} ${item}`)

      // 12. Definition lists
      .replace(/^([^:\n\r]+):\s*$/gm, (_, term) => chalk.bold.underline(term.trim()))
      .replace(/^:\s+(.+)$/gm, (_, definition) => `    ${chalk.gray('└─')} ${definition}`)

      // 13. Blockquotes (with nesting support)
      .replace(/^(\s*)(>{2,})\s*(.+)$/gm, (_, indent, quotes, text) => {
        const level = quotes.length;
        const prefix = '│ '.repeat(level);
        return `${indent}${chalk.gray(prefix)}${chalk.italic.gray(text)}`;
      })
      .replace(
        /^(\s*)>\s*(.+)$/gm,
        (_, indent, quote) => `${indent}${chalk.gray('│')} ${chalk.italic.gray(quote)}`
      )

      // 14. Footnotes
      .replace(/\[\^([^\]]+)\]:\s*(.+)$/gm, (_, ref, text) => {
        this.footnotes.set(ref, text);
        return '';
      })
      .replace(/\[\^([^\]]+)\]/g, (_, ref) => chalk.blue.dim(`[${ref}]`))

      // 15. Keyboard keys
      .replace(/<kbd>([^<]+)<\/kbd>/g, (_, key) => chalk.black.bgWhite(` ${key} `))

      // 16. Highlighting
      .replace(/==(.+?)==/g, (_, text) => chalk.black.bgYellow(text))

      // 17. Line breaks and spacing
      .replace(/\\\s*\n/g, '\n')
      .replace(/ {2}\n/g, '\n')

      // 18. HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&hellip;/g, '…')

      // 19. Restore escaped characters
      .replace(/__ESCAPED_(\d+)__/g, (_, code) => String.fromCharCode(parseInt(code)));

    // Add footnotes at the end if any
    if (this.footnotes.size > 0) {
      formatted += this.formatFootnotes();
    }

    return formatted;
  }

  private static formatCodeBlock(code: string, language?: string): string {
    const title = language ? this.getLanguageTitle(language) : 'CODE';
    const cleanCode = code.replace(/^\n+|\n+$/g, ''); // Remove leading/trailing newlines

    return (
      '\n' +
      boxen(cleanCode, {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        title: chalk.cyan(`⚡ ${title}`),
        titleAlignment: 'left',
        backgroundColor: 'black',
      }) +
      '\n'
    );
  }

  private static formatTable(headerRow: string, bodyRows: string): string {
    try {
      // Parse header
      const headers = headerRow
        .split('|')
        .map((h) => h.trim())
        .filter((h) => h.length > 0);

      // Parse rows
      const rows = bodyRows
        .trim()
        .split('\n')
        .map((row) =>
          row
            .split('|')
            .map((cell) => cell.trim())
            .filter((cell) => cell.length > 0)
        )
        .filter((row) => row.length > 0);

      // Create data array for console.table
      const tableData = rows.map((row) => {
        const rowObj: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowObj[header] = row[index] || '';
        });
        return rowObj;
      });

      // Capture console.table output
      const originalLog = console.log;
      let tableOutput = '';

      console.log = (...args) => {
        tableOutput += args.join(' ') + '\n';
      };

      console.table(tableData);
      console.log = originalLog;

      // Style the table output
      const styledTable = tableOutput
        .split('\n')
        .map((line, index) => {
          if (index === 0) return chalk.cyan.bold(line); // Header
          if (line.includes('─')) return chalk.gray(line); // Separators
          return line; // Data rows
        })
        .join('\n');

      return '\n' + chalk.cyan('📊 TABLE') + '\n' + styledTable + '\n';
    } catch {
      // Fallback to simple formatting
      return `\n${chalk.yellow('📊 TABLE')}:\n${headerRow}\n${bodyRows}\n`;
    }
  }

  private static formatMathBlock(math: string): string {
    const cleanMath = math.trim();

    // Enhanced math display with proper mathematical symbols
    const beautifiedMath = cleanMath
      // Greek letters
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      .replace(/\\gamma/g, 'γ')
      .replace(/\\delta/g, 'δ')
      .replace(/\\epsilon/g, 'ε')
      .replace(/\\lambda/g, 'λ')
      .replace(/\\mu/g, 'μ')
      .replace(/\\pi/g, 'π')
      .replace(/\\sigma/g, 'σ')
      .replace(/\\tau/g, 'τ')
      .replace(/\\phi/g, 'φ')
      .replace(/\\chi/g, 'χ')
      .replace(/\\omega/g, 'ω')
      .replace(/\\Omega/g, 'Ω')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\Gamma/g, 'Γ')
      .replace(/\\Lambda/g, 'Λ')
      .replace(/\\Phi/g, 'Φ')
      .replace(/\\Psi/g, 'Ψ')
      .replace(/\\Sigma/g, 'Σ')
      .replace(/\\Theta/g, 'Θ')

      // Mathematical operators
      .replace(/\\sum/g, '∑')
      .replace(/\\prod/g, '∏')
      .replace(/\\int/g, '∫')
      .replace(/\\infty/g, '∞')
      .replace(/\\partial/g, '∂')
      .replace(/\\nabla/g, '∇')
      .replace(/\\pm/g, '±')
      .replace(/\\mp/g, '∓')
      .replace(/\\cdot/g, '·')
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\neq/g, '≠')
      .replace(/\\leq/g, '≤')
      .replace(/\\geq/g, '≥')
      .replace(/\\approx/g, '≈')
      .replace(/\\equiv/g, '≡')
      .replace(/\\subset/g, '⊂')
      .replace(/\\supset/g, '⊃')
      .replace(/\\in/g, '∈')
      .replace(/\\notin/g, '∉')
      .replace(/\\cup/g, '∪')
      .replace(/\\cap/g, '∩')
      .replace(/\\emptyset/g, '∅')
      .replace(/\\forall/g, '∀')
      .replace(/\\exists/g, '∃')
      .replace(/\\rightarrow/g, '→')
      .replace(/\\leftarrow/g, '←')
      .replace(/\\leftrightarrow/g, '↔')
      .replace(/\\Rightarrow/g, '⇒')
      .replace(/\\Leftarrow/g, '⇐')
      .replace(/\\Leftrightarrow/g, '⇔')

      // Fractions (simple cases)
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')

      // Superscripts and subscripts (basic)
      .replace(/\^([a-zA-Z0-9])/g, '⁽$1⁾')
      .replace(/_([a-zA-Z0-9])/g, '₍$1₎')

      // Square roots
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')

      // Clean up remaining LaTeX commands
      .replace(/\\[a-zA-Z]+/g, (match) => `[${match}]`);

    return (
      '\n' +
      boxen(beautifiedMath, {
        padding: 1,
        borderStyle: 'double',
        borderColor: 'magenta',
        title: chalk.magenta.bold('📐 MATHEMATICS'),
        titleAlignment: 'center',
        backgroundColor: 'black',
      }) +
      '\n'
    );
  }

  private static formatInlineMath(math: string): string {
    const beautified = math
      .replace(/\\pi/g, 'π')
      .replace(/\\infty/g, '∞')
      .replace(/\\sum/g, '∑')
      .replace(/\\int/g, '∫')
      .replace(/\\sqrt/g, '√')
      .replace(/\\pm/g, '±')
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      .replace(/\\gamma/g, 'γ')
      .replace(/\\delta/g, 'δ')
      .replace(/\\lambda/g, 'λ')
      .replace(/\\mu/g, 'μ')
      .replace(/\\sigma/g, 'σ')
      .replace(/\\omega/g, 'ω')
      .replace(/\\theta/g, 'θ')
      .replace(/\^2/g, '²')
      .replace(/\^3/g, '³')
      .replace(/\^([0-9])/g, '⁽$1⁾')
      .replace(/_([0-9])/g, '₍$1₎');

    return chalk.magenta.italic(`⟨ ${beautified} ⟩`);
  }

  private static formatImage(alt: string, url: string): string {
    return `\n${chalk.cyan('🖼️  IMAGE:')} ${chalk.bold(alt || 'Untitled')}\n${chalk.blue.underline(url)}\n`;
  }

  private static formatLink(text: string, url: string): string {
    return chalk.blue.underline(text) + chalk.gray.dim(` → ${url}`);
  }

  private static formatRefLink(text: string, ref: string): string {
    return chalk.blue.underline(text) + chalk.blue.dim(`[${ref}]`);
  }

  private static formatFootnotes(): string {
    let result = '\n' + chalk.gray('─'.repeat(50)) + '\n';
    result += chalk.bold.yellow('📝 FOOTNOTES:\n\n');

    for (const [ref, text] of this.footnotes.entries()) {
      result += chalk.blue.bold(`[${ref}] `) + chalk.gray(text) + '\n';
    }

    return result;
  }

  private static getLanguageTitle(lang: string): string {
    const languages: Record<string, string> = {
      js: 'JAVASCRIPT',
      javascript: 'JAVASCRIPT',
      jsx: 'REACT JSX',
      ts: 'TYPESCRIPT',
      typescript: 'TYPESCRIPT',
      tsx: 'REACT TSX',
      py: 'PYTHON',
      python: 'PYTHON',
      py3: 'PYTHON 3',
      java: 'JAVA',
      kotlin: 'KOTLIN',
      scala: 'SCALA',
      cpp: 'C++',
      'c++': 'C++',
      c: 'C',
      rust: 'RUST',
      go: 'GO',
      php: 'PHP',
      ruby: 'RUBY',
      swift: 'SWIFT',
      dart: 'DART',
      html: 'HTML',
      css: 'CSS',
      scss: 'SASS',
      less: 'LESS',
      sql: 'SQL',
      mysql: 'MySQL',
      postgres: 'PostgreSQL',
      bash: 'BASH',
      sh: 'SHELL',
      zsh: 'ZSH',
      fish: 'FISH',
      json: 'JSON',
      xml: 'XML',
      yaml: 'YAML',
      yml: 'YAML',
      toml: 'TOML',
      ini: 'INI',
      conf: 'CONFIG',
      md: 'MARKDOWN',
      markdown: 'MARKDOWN',
      tex: 'LaTeX',
      r: 'R',
      matlab: 'MATLAB',
      octave: 'OCTAVE',
      docker: 'DOCKERFILE',
      dockerfile: 'DOCKERFILE',
    };

    return languages[lang.toLowerCase()] || lang.toUpperCase();
  }

  // Utility methods for special formatting

  static formatAlert(
    type: 'info' | 'warning' | 'error' | 'success',
    title: string,
    content: string
  ): string {
    const configs = {
      info: { icon: '💡', color: 'blue', borderColor: 'blue' },
      warning: { icon: '⚠️', color: 'yellow', borderColor: 'yellow' },
      error: { icon: '❌', color: 'red', borderColor: 'red' },
      success: { icon: '✅', color: 'green', borderColor: 'green' },
    };

    const config = configs[type];

    return (
      '\n' +
      boxen(content, {
        padding: 1,
        borderStyle: 'round',
        borderColor: config.borderColor as any,
        title: `${config.icon} ${title.toUpperCase()}`,
        titleAlignment: 'left',
      }) +
      '\n'
    );
  }

  static formatProgress(current: number, total: number, label?: string): string {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round(percentage / 2.5); // 40 chars total
    const empty = 40 - filled;

    const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    const text = label ? `${label}: ` : '';

    return `${text}${bar} ${chalk.bold.white(percentage + '%')} ${chalk.gray(`(${current}/${total})`)}`;
  }

  static formatKeyValue(data: Record<string, string | number | boolean>): string {
    const maxKeyLength = Math.max(...Object.keys(data).map((k) => k.length));

    return Object.entries(data)
      .map(([key, value]) => {
        const paddedKey = key.padEnd(maxKeyLength);
        return `${chalk.cyan.bold(paddedKey)} ${chalk.gray('│')} ${chalk.white(String(value))}`;
      })
      .join('\n');
  }

  // Method to format markdown for Ink components (returns structured data instead of ANSI codes)
  static formatForInk(text: string): InkMarkdownElement[] {
    // Reset footnotes for each format call
    this.footnotes.clear();

    const elements: InkMarkdownElement[] = [];
    const lines = text.split('\n');

    let inCodeBlock = false;
    let codeLanguage = '';
    let codeContent: string[] = [];
    let inMathBlock = false;
    let mathContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] || '';

      // Handle code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          elements.push({
            type: 'codeblock',
            content: codeContent.join('\n'),
            language: codeLanguage,
          });
          inCodeBlock = false;
          codeLanguage = '';
          codeContent = [];
        } else {
          // Start code block
          inCodeBlock = true;
          codeLanguage = line.trim().substring(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }

      // Handle math blocks \[ ... \]
      if (line.trim() === '\\[') {
        inMathBlock = true;
        mathContent = [];
        continue;
      }
      if (line.trim() === '\\]') {
        elements.push({
          type: 'mathblock',
          content: this.beautifyBlockMath(mathContent.join('\n')),
        });
        inMathBlock = false;
        mathContent = [];
        continue;
      }

      // Handle inline math blocks like \[ content \] on single line
      const inlineMathMatch = line.match(/\\\[(.*?)\\\]/);
      if (inlineMathMatch && inlineMathMatch[1]) {
        elements.push({
          type: 'mathblock',
          content: this.beautifyBlockMath(inlineMathMatch[1].trim()),
        });
        continue;
      }
      if (inMathBlock) {
        mathContent.push(line);
        continue;
      }

      // Handle $$ math blocks
      if (line.trim() === '$$') {
        if (inMathBlock) {
          elements.push({
            type: 'mathblock',
            content: this.beautifyBlockMath(mathContent.join('\n')),
          });
          inMathBlock = false;
          mathContent = [];
        } else {
          inMathBlock = true;
          mathContent = [];
        }
        continue;
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push({
          type: 'header',
          level: 1,
          content: line.substring(2).trim(),
        });
      } else if (line.startsWith('## ')) {
        elements.push({
          type: 'header',
          level: 2,
          content: line.substring(3).trim(),
        });
      } else if (line.startsWith('### ')) {
        elements.push({
          type: 'header',
          level: 3,
          content: line.substring(4).trim(),
        });
      } else if (line.startsWith('#### ')) {
        elements.push({
          type: 'header',
          level: 4,
          content: line.substring(5).trim(),
        });
      } else if (line.startsWith('##### ')) {
        elements.push({
          type: 'header',
          level: 5,
          content: line.substring(6).trim(),
        });
      } else if (line.startsWith('###### ')) {
        elements.push({
          type: 'header',
          level: 6,
          content: line.substring(7).trim(),
        });
      }
      // Horizontal rules
      else if (line.match(/^[-*_]{3,}\s*$/)) {
        elements.push({
          type: 'hr',
          content: '',
        });
      }
      // Lists
      else if (line.match(/^(\s*)[-*+]\s+(.+)$/)) {
        const match = line.match(/^(\s*)[-*+]\s+(.+)$/);
        if (match && match[1] !== undefined && match[2]) {
          elements.push({
            type: 'list',
            ordered: false,
            indent: match[1].length,
            content: this.parseInlineMarkdown(match[2]),
          });
        }
      }
      // Numbered lists
      else if (line.match(/^(\s*)(\d+)\.\s+(.+)$/)) {
        const match = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
        if (match && match[1] !== undefined && match[2] && match[3]) {
          elements.push({
            type: 'list',
            ordered: true,
            number: parseInt(match[2]),
            indent: match[1].length,
            content: this.parseInlineMarkdown(match[3]),
          });
        }
      }
      // Blockquotes
      else if (line.startsWith('> ')) {
        elements.push({
          type: 'blockquote',
          content: this.parseInlineMarkdown(line.substring(2)),
        });
      }
      // Empty lines
      else if (line.trim() === '') {
        elements.push({
          type: 'empty',
          content: '',
        });
      }
      // Regular text
      else {
        elements.push({
          type: 'text',
          content: this.parseInlineMarkdown(line),
        });
      }
    }

    return elements;
  }

  private static parseInlineMarkdown(text: string): InlineElement[] {
    const elements: InlineElement[] = [];
    let remaining = text;

    // Handle inline math first \( ... \)
    remaining = remaining.replace(/\\\((.+?)\\\)/g, (_, math) => {
      const placeholder = `__MATH_${elements.length}__`;
      elements.push({ type: 'math', content: this.beautifyInlineMath(math.trim()) });
      return placeholder;
    });

    // Handle inline code `code`
    remaining = remaining.replace(/`(.+?)`/g, (_, code) => {
      const placeholder = `__CODE_${elements.length}__`;
      elements.push({ type: 'code', content: code });
      return placeholder;
    });

    // Handle bold **text**
    remaining = remaining.replace(/\*\*(.+?)\*\*/g, (_, text) => {
      const placeholder = `__BOLD_${elements.length}__`;
      elements.push({ type: 'bold', content: text });
      return placeholder;
    });

    // Handle italic *text*
    remaining = remaining.replace(/\*(.+?)\*/g, (_, text) => {
      const placeholder = `__ITALIC_${elements.length}__`;
      elements.push({ type: 'italic', content: text });
      return placeholder;
    });

    // Handle strikethrough ~~text~~
    remaining = remaining.replace(/~~(.+?)~~/g, (_, text) => {
      const placeholder = `__STRIKE_${elements.length}__`;
      elements.push({ type: 'strikethrough', content: text });
      return placeholder;
    });

    // Handle links [text](url)
    remaining = remaining.replace(/\[(.+?)\]\((.+?)\)/g, (_, text, url) => {
      const placeholder = `__LINK_${elements.length}__`;
      elements.push({ type: 'link', content: text, url });
      return placeholder;
    });

    // Split by placeholders and add text elements
    const parts = remaining.split(/(__(?:MATH|CODE|BOLD|ITALIC|STRIKE|LINK)_\d+__)/);
    const result: InlineElement[] = [];

    parts.forEach((part) => {
      const match = part.match(/__(?:MATH|CODE|BOLD|ITALIC|STRIKE|LINK)_(\d+)__/);
      if (match && match[1]) {
        const element = elements[parseInt(match[1])];
        if (element) result.push(element);
      } else if (part.trim()) {
        result.push({ type: 'text', content: part });
      }
    });

    return result;
  }

  private static beautifyInlineMath(math: string): string {
    return this.beautifyBlockMath(math);
  }

  private static beautifyBlockMath(math: string): string {
    return (
      math
        // Greek letters
        .replace(/\\alpha/g, 'α')
        .replace(/\\beta/g, 'β')
        .replace(/\\gamma/g, 'γ')
        .replace(/\\delta/g, 'δ')
        .replace(/\\epsilon/g, 'ε')
        .replace(/\\lambda/g, 'λ')
        .replace(/\\mu/g, 'μ')
        .replace(/\\pi/g, 'π')
        .replace(/\\sigma/g, 'σ')
        .replace(/\\tau/g, 'τ')
        .replace(/\\phi/g, 'φ')
        .replace(/\\chi/g, 'χ')
        .replace(/\\omega/g, 'ω')
        .replace(/\\Omega/g, 'Ω')
        .replace(/\\Delta/g, 'Δ')
        .replace(/\\Lambda/g, 'Λ')
        .replace(/\\kappa/g, 'κ')
        .replace(/\\nu/g, 'ν')
        // Math symbols
        .replace(/\\infty/g, '∞')
        .replace(/\\sum/g, '∑')
        .replace(/\\prod/g, '∏')
        .replace(/\\int/g, '∫')
        .replace(/\\partial/g, '∂')
        .replace(/\\nabla/g, '∇')
        .replace(/\\pm/g, '±')
        .replace(/\\mp/g, '∓')
        .replace(/\\cdot/g, '·')
        .replace(/\\times/g, '×')
        .replace(/\\div/g, '÷')
        .replace(/\\neq/g, '≠')
        .replace(/\\leq/g, '≤')
        .replace(/\\geq/g, '≥')
        .replace(/\\approx/g, '≈')
        .replace(/\\hbar/g, 'ℏ')
        // Functions and structures
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
        .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
        .replace(/\\text\{([^}]+)\}/g, '$1')
        // Remove remaining backslashes from simple cases
        .replace(/\\([a-zA-Z])/g, '$1')
    );
  }
}

// Types for Ink-compatible markdown
export interface InkMarkdownElement {
  type: 'header' | 'text' | 'list' | 'codeblock' | 'mathblock' | 'blockquote' | 'hr' | 'empty';
  content: string | InlineElement[];
  level?: number; // for headers
  language?: string; // for code blocks
  ordered?: boolean; // for lists
  number?: number; // for numbered lists
  indent?: number; // for lists
  url?: string; // for links
}

export interface InlineElement {
  type: 'text' | 'bold' | 'italic' | 'code' | 'math' | 'strikethrough' | 'link';
  content: string;
  url?: string; // for links
}

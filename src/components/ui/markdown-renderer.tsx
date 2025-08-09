import React from 'react';
import { Box, Text } from 'ink';
// Markdown renderer logic adapted from MarkdownFormatter

interface MarkdownRendererProps {
  content: string;
  streaming?: boolean;
  action?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  streaming = false,
  action = 'default'
}) => {
  // Suppress unused variable warning
  void action;
  // Parse markdown into structured React components
  const parseToComponents = (text: string) => {
    const lines = text.split('\n');
    const components: React.ReactNode[] = [];
    let currentCodeBlock = '';
    let inCodeBlock = false;
    let codeLanguage = '';
    let currentTable = { headers: [] as string[], rows: [] as string[][] };
    let inTable = false;

    lines.forEach((line, index) => {
      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          components.push(
            <CodeBlock key={`code-${index}`} code={currentCodeBlock} language={codeLanguage} />
          );
          currentCodeBlock = '';
          inCodeBlock = false;
          codeLanguage = '';
        } else {
          // Start code block
          inCodeBlock = true;
          codeLanguage = line.replace('```', '').trim();
        }
        return;
      }

      if (inCodeBlock) {
        currentCodeBlock += line + '\n';
        return;
      }

      // Tables
      if (line.includes('|') && line.trim().startsWith('|')) {
        if (!inTable) {
          // Start table - this is the header
          currentTable.headers = line.split('|').map(h => h.trim()).filter(h => h.length > 0);
          inTable = true;
          return;
        } else {
          // Check if this is a separator line
          if (line.match(/^\|[\s\-:|]+\|$/)) {
            return; // Skip separator lines
          }
          // This is a data row
          const row = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
          currentTable.rows.push(row);
          return;
        }
      } else if (inTable) {
        // End of table
        components.push(
          <TableComponent key={`table-${index}`} headers={currentTable.headers} rows={currentTable.rows} />
        );
        currentTable = { headers: [], rows: [] };
        inTable = false;
      }

      // Headers
      if (line.startsWith('# ')) {
        components.push(
          <Box key={index} marginY={1}>
            <Text color="green" bold underline>
              {line.replace('# ', '').toUpperCase()}
            </Text>
          </Box>
        );
      } else if (line.startsWith('## ')) {
        components.push(
          <Box key={index} marginY={0.5}>
            <Text color="cyan" bold>
              {line.replace('## ', '')}
            </Text>
          </Box>
        );
      } else if (line.startsWith('### ')) {
        components.push(
          <Box key={index}>
            <Text color="blue" bold>
              ▸ {line.replace('### ', '')}
            </Text>
          </Box>
        );
      }
      // Math blocks
      else if (line.match(/\$\$.*\$\$/)) {
        const math = line.replace(/\$\$/g, '');
        components.push(
          <MathBlock key={index} content={math} />
        );
      }
      // Blockquotes
      else if (line.startsWith('> ')) {
        components.push(
          <Box key={index} marginLeft={2}>
            <Text color="gray">│ </Text>
            <Text color="gray" italic>{line.replace('> ', '')}</Text>
          </Box>
        );
      }
      // Lists
      else if (line.match(/^[\s]*[-*+]\s/)) {
        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? (indentMatch[1]?.length || 0) : 0;
        const content = line.replace(/^[\s]*[-*+]\s/, '');
        components.push(
          <Box key={index} marginLeft={Math.floor(indent / 2)}>
            <Text color="yellow">• </Text>
            <Text>{formatInlineMarkdown(content)}</Text>
          </Box>
        );
      }
      // Numbered lists
      else if (line.match(/^[\s]*\d+\.\s/)) {
        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? (indentMatch[1]?.length || 0) : 0;
        const numberedMatch = line.match(/^[\s]*(\d+)\.\s(.+)$/);
        if (numberedMatch && numberedMatch[1] && numberedMatch[2]) {
          components.push(
            <Box key={index} marginLeft={Math.floor(indent / 2)}>
              <Text color="cyan" bold>{numberedMatch[1]}. </Text>
              <Text>{formatInlineMarkdown(numberedMatch[2])}</Text>
            </Box>
          );
        }
      }
      // Task lists
      else if (line.match(/^[\s]*-\s\[[ x]\]\s/)) {
        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? (indentMatch[1]?.length || 0) : 0;
        const checked = line.includes('[x]');
        const content = line.replace(/^[\s]*-\s\[[ x]\]\s/, '');
        components.push(
          <Box key={index} marginLeft={Math.floor(indent / 2)}>
            <Text color={checked ? "green" : "gray"}>{checked ? '✅' : '⬜'} </Text>
            <Text color={checked ? "gray" : "white"} strikethrough={checked}>
              {formatInlineMarkdown(content)}
            </Text>
          </Box>
        );
      }
      // Horizontal rules
      else if (line.match(/^[-*_]{3,}$/)) {
        components.push(
          <Box key={index} marginY={1}>
            <Text color="gray">{'─'.repeat(60)}</Text>
          </Box>
        );
      }
      // Regular text
      else if (line.trim()) {
        components.push(
          <Text key={index} wrap="wrap">{formatInlineMarkdown(line)}</Text>
        );
      } else {
        // Empty line for spacing
        components.push(<Box key={index} height={1} />);
      }
    });

    // Handle remaining table if file ends with table
    if (inTable && currentTable.headers.length > 0) {
      components.push(
        <TableComponent key="final-table" headers={currentTable.headers} rows={currentTable.rows} />
      );
    }

    return components;
  };

  const formatInlineMarkdown = (text: string): React.ReactNode => {
    // Handle inline formatting
    const parts: React.ReactNode[] = [];
    let currentText = text;
    let keyCounter = 0;

    // Process **bold** text
    currentText = currentText.replace(/\*\*(.+?)\*\*/g, (_, content) => {
      const placeholder = `__BOLD_${keyCounter}__`;
      parts.push(<Text key={`bold-${keyCounter}`} bold>{content}</Text>);
      keyCounter++;
      return placeholder;
    });

    // Process *italic* text
    currentText = currentText.replace(/\*(.+?)\*/g, (_, content) => {
      const placeholder = `__ITALIC_${keyCounter}__`;
      parts.push(<Text key={`italic-${keyCounter}`} italic>{content}</Text>);
      keyCounter++;
      return placeholder;
    });

    // Process `inline code`
    currentText = currentText.replace(/`(.+?)`/g, (_, content) => {
      const placeholder = `__CODE_${keyCounter}__`;
      parts.push(<Text key={`code-${keyCounter}`} backgroundColor="gray" color="black"> {content} </Text>);
      keyCounter++;
      return placeholder;
    });

    // Process ~~strikethrough~~
    currentText = currentText.replace(/~~(.+?)~~/g, (_, content) => {
      const placeholder = `__STRIKE_${keyCounter}__`;
      parts.push(<Text key={`strike-${keyCounter}`} strikethrough>{content}</Text>);
      keyCounter++;
      return placeholder;
    });

    // If no special formatting, return plain text
    if (parts.length === 0) {
      return text;
    }

    // Split text and insert formatted parts
    const result: React.ReactNode[] = [];
    let textParts = currentText.split(/(__(?:BOLD|ITALIC|CODE|STRIKE)_\d+__)/);
    
    textParts.forEach((part, index) => {
      const placeholderMatch = part.match(/__(?:BOLD|ITALIC|CODE|STRIKE)_(\d+)__/);
      if (placeholderMatch && placeholderMatch[1]) {
        result.push(parts[parseInt(placeholderMatch[1])]);
      } else if (part) {
        result.push(<Text key={`text-${index}`}>{part}</Text>);
      }
    });

    return result;
  };

  // Show streaming cursor
  const streamingCursor = streaming ? (
    <Text color="cyan" dimColor>▋</Text>
  ) : null;

  return (
    <Box flexDirection="column">
      {parseToComponents(content)}
      {streamingCursor}
    </Box>
  );
};

// Math component with enhanced formatting
const MathBlock: React.FC<{ content: string }> = ({ content }) => {
  const beautified = content
    // Greek letters
    .replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β').replace(/\\gamma/g, 'γ')
    .replace(/\\delta/g, 'δ').replace(/\\epsilon/g, 'ε').replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'μ').replace(/\\pi/g, 'π').replace(/\\sigma/g, 'σ')
    .replace(/\\tau/g, 'τ').replace(/\\phi/g, 'φ').replace(/\\chi/g, 'χ')
    .replace(/\\omega/g, 'ω').replace(/\\Omega/g, 'Ω').replace(/\\Delta/g, 'Δ')
    // Mathematical operators
    .replace(/\\sum/g, '∑').replace(/\\prod/g, '∏').replace(/\\int/g, '∫')
    .replace(/\\infty/g, '∞').replace(/\\partial/g, '∂').replace(/\\nabla/g, '∇')
    .replace(/\\pm/g, '±').replace(/\\mp/g, '∓').replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\neq/g, '≠')
    .replace(/\\leq/g, '≤').replace(/\\geq/g, '≥').replace(/\\approx/g, '≈')
    .replace(/\\equiv/g, '≡').replace(/\\in/g, '∈').replace(/\\notin/g, '∉')
    .replace(/\\cup/g, '∪').replace(/\\cap/g, '∩').replace(/\\emptyset/g, '∅')
    .replace(/\\forall/g, '∀').replace(/\\exists/g, '∃')
    .replace(/\\rightarrow/g, '→').replace(/\\leftarrow/g, '←')
    .replace(/\\Rightarrow/g, '⇒').replace(/\\Leftarrow/g, '⇐')
    // Fractions (simple)
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
    // Square roots
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    // Clean up remaining LaTeX
    .replace(/\\[a-zA-Z]+/g, (match) => `[${match}]`);

  return (
    <Box
      borderStyle="double"
      borderColor="magenta"
      paddingX={2}
      paddingY={1}
      marginY={1}
    >
      <Box flexDirection="column" alignItems="center">
        <Text color="magenta" bold>📐 MATHEMATICS</Text>
        <Text color="magenta" italic>{beautified}</Text>
      </Box>
    </Box>
  );
};

// Enhanced Code Block for Ink
const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const getLanguageTitle = (lang: string): string => {
    const languages: Record<string, string> = {
      js: 'JAVASCRIPT', javascript: 'JAVASCRIPT', jsx: 'REACT JSX',
      ts: 'TYPESCRIPT', typescript: 'TYPESCRIPT', tsx: 'REACT TSX',
      py: 'PYTHON', python: 'PYTHON', java: 'JAVA', cpp: 'C++',
      c: 'C', rust: 'RUST', go: 'GO', php: 'PHP', ruby: 'RUBY',
      html: 'HTML', css: 'CSS', sql: 'SQL', bash: 'BASH', sh: 'SHELL',
      json: 'JSON', yaml: 'YAML', xml: 'XML', md: 'MARKDOWN'
    };
    return languages[lang.toLowerCase()] || lang.toUpperCase();
  };

  return (
    <Box
      borderStyle="round"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
      marginY={1}
    >
      <Box flexDirection="column">
        {language && (
          <Text color="cyan" bold>⚡ {getLanguageTitle(language)}</Text>
        )}
        <Text wrap="wrap">{code.trim()}</Text>
      </Box>
    </Box>
  );
};

// Advanced Table Component for Ink
const TableComponent: React.FC<{ headers: string[]; rows: string[][] }> = ({ headers, rows }) => {
  if (headers.length === 0) return null;

  const maxWidths = headers.map((header, i) => 
    Math.max(
      header.length,
      ...rows.map(row => (row[i] || '').length),
      8 // minimum width
    )
  );

  return (
    <Box flexDirection="column" marginY={1}>
      <Text color="cyan" bold>📊 TABLE</Text>
      
      {/* Header */}
      <Box>
        {headers.map((header, i) => (
          <Text key={i} color="cyan" bold>
            {header.padEnd((maxWidths[i] || 8) + 2)}
          </Text>
        ))}
      </Box>
      
      {/* Separator */}
      <Text color="gray">
        {maxWidths.map(w => '─'.repeat(w + 2)).join('')}
      </Text>
      
      {/* Rows */}
      {rows.map((row, rowIndex) => (
        <Box key={rowIndex}>
          {row.map((cell, cellIndex) => (
            <Text key={cellIndex}>
              {(cell || '').padEnd((maxWidths[cellIndex] || 8) + 2)}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  );
};

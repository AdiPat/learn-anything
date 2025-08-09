import React from 'react';
import { Box, Text } from 'ink';
import { MarkdownFormatter, InkMarkdownElement, InlineElement } from '@/utils/markdown.js';

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
  
  // Use the new Ink-compatible formatter
  const elements = MarkdownFormatter.formatForInk(content);
  
  const renderInlineElements = (elements: InlineElement[]): React.ReactNode[] => {
    return elements.map((element, index) => {
      switch (element.type) {
        case 'bold':
          return <Text key={index} bold>{element.content}</Text>;
        case 'italic':
          return <Text key={index} italic>{element.content}</Text>;
        case 'code':
          return <Text key={index} backgroundColor="gray" color="black"> {element.content} </Text>;
        case 'math':
          return <Text key={index} color="magenta" italic>⟨ {element.content} ⟩</Text>;
        case 'strikethrough':
          return <Text key={index} strikethrough>{element.content}</Text>;
        case 'link':
          return <Text key={index} color="blue" underline>{element.content}</Text>;
        default:
          return <Text key={index}>{element.content}</Text>;
      }
    });
  };

  const renderElements = (elements: InkMarkdownElement[]): React.ReactNode[] => {
    return elements.map((element, index) => {
      switch (element.type) {
        case 'header':
          const headerColors = ['green', 'cyan', 'blue', 'yellow', 'magenta', 'gray'];
          const color = headerColors[(element.level || 1) - 1] || 'white';
          const prefix = element.level === 1 ? '' : element.level === 2 ? '' : '▸ ';
          return (
            <Box key={index} marginY={element.level === 1 ? 1 : element.level === 2 ? 0.5 : 0}>
              <Text color={color} bold underline={element.level === 1}>
                {prefix}{typeof element.content === 'string' ? element.content.toUpperCase() : 
                  Array.isArray(element.content) ? renderInlineElements(element.content) : ''}
              </Text>
            </Box>
          );
          
        case 'codeblock':
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
            <Box key={index} borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1} marginY={1}>
              <Box flexDirection="column">
                {element.language && (
                  <Text color="cyan" bold>⚡ {getLanguageTitle(element.language)}</Text>
                )}
                <Text wrap="wrap">{typeof element.content === 'string' ? element.content.trim() : ''}</Text>
              </Box>
            </Box>
          );
          
        case 'mathblock':
          const beautifyMath = (math: string): string => {
            return math
              .replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β').replace(/\\gamma/g, 'γ')
              .replace(/\\delta/g, 'δ').replace(/\\epsilon/g, 'ε').replace(/\\lambda/g, 'λ')
              .replace(/\\mu/g, 'μ').replace(/\\pi/g, 'π').replace(/\\sigma/g, 'σ')
              .replace(/\\tau/g, 'τ').replace(/\\phi/g, 'φ').replace(/\\chi/g, 'χ')
              .replace(/\\omega/g, 'ω').replace(/\\Omega/g, 'Ω').replace(/\\Delta/g, 'Δ')
              .replace(/\\sum/g, '∑').replace(/\\prod/g, '∏').replace(/\\int/g, '∫')
              .replace(/\\infty/g, '∞').replace(/\\partial/g, '∂').replace(/\\nabla/g, '∇')
              .replace(/\\pm/g, '±').replace(/\\mp/g, '∓').replace(/\\cdot/g, '·')
              .replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\neq/g, '≠')
              .replace(/\\leq/g, '≤').replace(/\\geq/g, '≥').replace(/\\approx/g, '≈')
              .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
              .replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
          };
          
          return (
            <Box key={index} borderStyle="double" borderColor="magenta" paddingX={2} paddingY={1} marginY={1}>
              <Box flexDirection="column" alignItems="center">
                <Text color="magenta" bold>📐 MATHEMATICS</Text>
                <Text color="magenta" italic>{beautifyMath(typeof element.content === 'string' ? element.content : '')}</Text>
              </Box>
            </Box>
          );
          
        case 'list':
          const bullet = element.ordered ? `${element.number || 1}. ` : '• ';
          const bulletColor = element.ordered ? 'cyan' : 'yellow';
          const margin = Math.floor((element.indent || 0) / 2);
          
          return (
            <Box key={index} marginLeft={margin}>
              <Text color={bulletColor} bold={!!element.ordered}>{bullet}</Text>
              <Text>{Array.isArray(element.content) ? renderInlineElements(element.content) : element.content}</Text>
            </Box>
          );
          
        case 'blockquote':
          return (
            <Box key={index} marginLeft={2}>
              <Text color="gray">│ </Text>
              <Text color="gray" italic>
                {Array.isArray(element.content) ? renderInlineElements(element.content) : element.content}
              </Text>
            </Box>
          );
          
        case 'hr':
          return (
            <Box key={index} marginY={1}>
              <Text color="gray">{'─'.repeat(60)}</Text>
            </Box>
          );
          
        case 'empty':
          return <Box key={index} height={1} />;
          
        default: // text
          return (
            <Text key={index} wrap="wrap">
              {Array.isArray(element.content) ? renderInlineElements(element.content) : element.content}
            </Text>
          );
      }
    });
  };

  // Show streaming cursor
  const streamingCursor = streaming ? (
    <Text color="cyan" dimColor>▋</Text>
  ) : null;

  return (
    <Box flexDirection="column">
      {renderElements(elements)}
      {streamingCursor}
    </Box>
  );
};
import { HybridUIManager } from './hybrid-ui.js';
import { EnhancedUIManager } from './enhanced-ui.js';
// Smart UI manager combining different rendering approaches

// The ultimate UI manager that brings everything together
export class UltimateUIManager extends HybridUIManager {
  constructor() {
    super({
      useInkComponents: true,
      preferTerminalForMarkdown: false, // Use Ink for markdown by default
      enableStreamingInk: true,
    });
  }

  // Smart rendering that chooses the best approach based on content
  public smartRender(
    content: string,
    action: string,
    options: {
      preferSpeed?: boolean;
      forceInk?: boolean;
      forceTerminal?: boolean;
    } = {}
  ): void {
    const { preferSpeed = false, forceInk = false, forceTerminal = false } = options;

    // Force specific rendering mode if requested
    if (forceInk) {
      this.setRenderingMode(true, false);
      this.showResponse(content, action);
      return;
    }

    if (forceTerminal) {
      this.setRenderingMode(false, true);
      this.showResponse(content, action);
      return;
    }

    // Smart decision based on content complexity and preferences
    const hasComplexMarkdown = this.analyzeContentComplexity(content);
    const isLongContent = content.length > 2000;

    if (preferSpeed || isLongContent) {
      // Use fast terminal rendering for speed
      this.setRenderingMode(false, true);
    } else if (hasComplexMarkdown) {
      // Use Ink components for rich content
      this.setRenderingMode(true, false);
    } else {
      // Default to enhanced terminal rendering
      this.setRenderingMode(false, true);
    }

    this.showResponse(content, action);
  }

  private analyzeContentComplexity(content: string): boolean {
    // Check for complex markdown elements that benefit from Ink rendering
    const complexPatterns = [
      /\$\$.*\$\$/, // Math blocks
      /\|.*\|.*\|/, // Tables
      /```[\s\S]*?```/, // Code blocks
      /\[.*\]\(.*\)/, // Links
      /!\[.*\]\(.*\)/, // Images
      /^\s*[-*+]\s+\[[ x]\]/m, // Task lists
      /^#+\s/m, // Multiple headers
    ];

    return complexPatterns.some((pattern) => pattern.test(content));
  }

  // Method to demonstrate all rendering modes
  public async demoAllModes(content: string): Promise<void> {
    console.log('\n🎨 Demonstrating All Rendering Modes\n');

    // Mode 1: Terminal rendering (fastest)
    console.log('1️⃣ Terminal Rendering (Production MarkdownFormatter):');
    console.log('='.repeat(60));
    this.smartRender(content, 'demo', { forceTerminal: true });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mode 2: Ink rendering (most beautiful)
    console.log('\n2️⃣ Ink Component Rendering (Beautiful):');
    console.log('='.repeat(60));
    this.smartRender(content, 'demo', { forceInk: true });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Mode 3: Smart rendering (best choice)
    console.log('\n3️⃣ Smart Rendering (Automatic Best Choice):');
    console.log('='.repeat(60));
    this.smartRender(content, 'demo');

    this.cleanup();
  }
}

// Factory function to create the right UI manager for different scenarios
export function createUIManager(scenario: 'production' | 'demo' | 'development' = 'production') {
  switch (scenario) {
    case 'production':
      // For production, prioritize reliability and speed
      return new UltimateUIManager();

    case 'demo':
      // For demos, prioritize visual appeal
      return new HybridUIManager({
        useInkComponents: true,
        preferTerminalForMarkdown: false,
        enableStreamingInk: true,
      });

    case 'development':
      // For development, use the enhanced terminal UI for speed
      return new EnhancedUIManager();

    default:
      return new UltimateUIManager();
  }
}

// Example usage patterns
export const examples = {
  // Fast rendering for large content
  fastMode: (ui: UltimateUIManager, content: string) => {
    ui.smartRender(content, 'explain', { preferSpeed: true });
  },

  // Beautiful rendering for demos
  demoMode: (ui: UltimateUIManager, content: string) => {
    ui.smartRender(content, 'explain', { forceInk: true });
  },

  // Automatic smart choice
  smartMode: (ui: UltimateUIManager, content: string) => {
    ui.smartRender(content, 'explain');
  },

  // Streaming example
  streamingExample: async (ui: UltimateUIManager, content: string) => {
    // Simulate streaming
    async function* streamContent() {
      const chunks = content.split('');
      for (const chunk of chunks) {
        yield chunk;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    ui.streamResponse(streamContent(), 'explain');
  },
};

// Export the main UI manager for the application
export const createMainUIManager = () => createUIManager('production');

import { describe, it, expect } from 'vitest';
import { VERSION } from '@/index.js';

describe('Learn Anything Core', () => {
  describe('VERSION', () => {
    it('should have correct version', () => {
      expect(VERSION).toBe('1.0.0');
    });
  });

  // TODO: Add comprehensive tests for the new core functionality
  // This includes testing AIService, ChatSession, OutputManager, and CLI actions
  it('should export core functionality', () => {
    expect(VERSION).toBeDefined();
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';
import { learnTopic, VERSION } from '@/index';
import fs from 'fs/promises';

vi.mock('fs/promises');

describe('Learn Anything Core', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('VERSION', () => {
    it('should have correct version', () => {
      expect(VERSION).toBe('1.0.0');
    });
  });

  describe('learnTopic', () => {
    const baseOptions = {
      topic: 'AI in Education',
      model: 'gpt-4o',
      temperature: '0.7',
      chat: false,
      disableConsole: false,
    };

    it('should generate content and save to a default file', async () => {
      const options = { ...baseOptions };
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      const mkdirSpy = vi.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await learnTopic(options);

      expect(mkdirSpy).toHaveBeenCalledWith('output', { recursive: true });
      expect(writeFileSpy).toHaveBeenCalled();
      const call = writeFileSpy.mock.calls[0];
      if (call) {
        expect(call[0]).toMatch(/output\/output_\d+\.md/);
        expect(call[1]).toContain('# Learning about AI in Education');
      } else {
        throw new Error('writeFile was not called');
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('# Learning about AI in Education')
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Output also saved to'));
    });

    it('should save to a specified output file', async () => {
      const options = { ...baseOptions, output: 'my-learning.md' };
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await learnTopic(options);

      expect(writeFileSpy).toHaveBeenCalledWith('my-learning.md', expect.any(String));
      expect(consoleSpy).toHaveBeenCalledWith('📚 Output saved to my-learning.md');
    });

    it('should disable console output when requested', async () => {
      const options = { ...baseOptions, output: 'silent.md', disableConsole: true };
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await learnTopic(options);

      expect(writeFileSpy).toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalledWith('📚 Output saved to silent.md');
    });

    it('should show chat message when chat is enabled', async () => {
      const options = { ...baseOptions, chat: true };
      vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      vi.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await learnTopic(options);

      expect(consoleSpy).toHaveBeenCalledWith(
        '\n💬 Starting interactive chat session... (Not implemented yet)'
      );
    });
  });
});

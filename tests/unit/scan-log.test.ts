/**
 * Unit tests for scan-log module.
 */

import { describe, expect, test } from 'bun:test';
import { detectGame, parseLogSegments } from '@/lib/scan-log/index.ts';

describe('detectGame', () => {
  test('detects Fallout 4 from content', () => {
    expect(detectGame('Fallout4.exe crashed')).toBe('fallout4');
    expect(detectGame('F4SE loader initialized')).toBe('fallout4');
    expect(detectGame('Buffout4 v1.31.1')).toBe('fallout4');
  });

  test('detects Skyrim from content', () => {
    expect(detectGame('SkyrimSE.exe crashed')).toBe('skyrim');
    expect(detectGame('SKSE plugin loaded')).toBe('skyrim');
    expect(detectGame('NetScriptFramework crash log')).toBe('skyrim');
  });

  test('detects from filename patterns', () => {
    expect(detectGame('', 'crash-2024-01-01.log')).toBe('fallout4');
    expect(detectGame('', 'Buffout4_crash.log')).toBe('fallout4');
    expect(detectGame('', 'NetScriptFramework-crash.log')).toBe('skyrim');
  });

  test('returns undefined for unknown content', () => {
    expect(detectGame('random text')).toBeUndefined();
    expect(detectGame('')).toBeUndefined();
  });
});

describe('parseLogSegments', () => {
  test('parses header segment', () => {
    const content = `Buffout4 v1.31.1
Fallout4 v1.10.163
Some other header info`;

    const result = parseLogSegments(content, 'fallout4');

    expect(result.game).toBe('fallout4');
    expect(result.totalLines).toBe(3);
    expect(result.generator).toBe('Buffout4');
  });

  test('identifies callstack segment', () => {
    const content = `Header
Call Stack:
0x12345678 function1
0x87654321 function2`;

    const result = parseLogSegments(content, 'fallout4');

    const callstackSegment = result.segments.find((s) => s.type === 'callstack');
    expect(callstackSegment).toBeDefined();
  });

  test('handles empty content', () => {
    const result = parseLogSegments('', 'fallout4');

    expect(result.totalLines).toBe(1); // Empty string splits to ['']
    expect(result.game).toBe('fallout4');
  });
});

/**
 * Unit tests for utility functions.
 */

import { describe, expect, test } from 'bun:test';
import { formatDuration, formatFileSize, isWindows, truncate } from '@/lib/utils/index.ts';

describe('formatDuration', () => {
  test('formats milliseconds correctly', () => {
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(0)).toBe('0ms');
    expect(formatDuration(999)).toBe('999ms');
  });

  test('formats seconds correctly', () => {
    expect(formatDuration(1000)).toBe('1.0s');
    expect(formatDuration(1500)).toBe('1.5s');
    expect(formatDuration(59999)).toBe('60.0s');
  });

  test('formats minutes correctly', () => {
    expect(formatDuration(60000)).toBe('1m 0s');
    expect(formatDuration(90000)).toBe('1m 30s');
    expect(formatDuration(125000)).toBe('2m 5s');
  });
});

describe('formatFileSize', () => {
  test('formats bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1023)).toBe('1023 B');
  });

  test('formats kilobytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(10240)).toBe('10.0 KB');
  });

  test('formats megabytes correctly', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(1024 * 1024 * 5.5)).toBe('5.5 MB');
  });

  test('formats gigabytes correctly', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
  });
});

describe('truncate', () => {
  test('returns original string if short enough', () => {
    expect(truncate('hello', 10)).toBe('hello');
    expect(truncate('hello', 5)).toBe('hello');
  });

  test('truncates long strings with ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
    expect(truncate('this is a long string', 10)).toBe('this is...');
  });

  test('handles edge cases', () => {
    expect(truncate('', 5)).toBe('');
    expect(truncate('abc', 3)).toBe('abc');
  });
});

describe('isWindows', () => {
  test('returns boolean', () => {
    const result = isWindows();
    expect(typeof result).toBe('boolean');
  });
});

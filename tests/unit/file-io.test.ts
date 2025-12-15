/**
 * Unit tests for file-io module.
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import {
  exists,
  getMetadata,
  readLines,
  readTextFile,
  writeTextFile,
} from '@/lib/file-io/index.ts';

const TEST_DIR = join(import.meta.dir, '../.test-temp');
const TEST_FILE = join(TEST_DIR, 'test.txt');

beforeAll(async () => {
  await mkdir(TEST_DIR, { recursive: true });
});

afterAll(async () => {
  await rm(TEST_DIR, { recursive: true, force: true });
});

describe('writeTextFile', () => {
  test('writes content to file', async () => {
    const result = await writeTextFile(TEST_FILE, 'Hello, World!');
    expect(result.success).toBe(true);
  });
});

describe('readTextFile', () => {
  test('reads content from file', async () => {
    await writeTextFile(TEST_FILE, 'Test content');

    const result = await readTextFile(TEST_FILE);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('Test content');
    }
  });

  test('returns error for non-existent file', async () => {
    const result = await readTextFile(join(TEST_DIR, 'nonexistent.txt'));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('not found');
    }
  });
});

describe('exists', () => {
  test('returns true for existing file', async () => {
    await writeTextFile(TEST_FILE, 'content');
    expect(await exists(TEST_FILE)).toBe(true);
  });

  test('returns false for non-existent file', async () => {
    expect(await exists(join(TEST_DIR, 'nope.txt'))).toBe(false);
  });
});

describe('getMetadata', () => {
  test('returns metadata for file', async () => {
    await writeTextFile(TEST_FILE, 'metadata test');

    const result = await getMetadata(TEST_FILE);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isFile).toBe(true);
      expect(result.data.isDirectory).toBe(false);
      expect(result.data.size).toBeGreaterThan(0);
    }
  });
});

describe('readLines', () => {
  test('reads lines from file', async () => {
    await writeTextFile(TEST_FILE, 'line1\nline2\nline3');

    const result = await readLines(TEST_FILE);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(['line1', 'line2', 'line3']);
    }
  });

  test('skips empty lines when configured', async () => {
    await writeTextFile(TEST_FILE, 'line1\n\nline2\n\nline3');

    const result = await readLines(TEST_FILE, { skipEmpty: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(['line1', 'line2', 'line3']);
    }
  });

  test('limits lines when configured', async () => {
    await writeTextFile(TEST_FILE, 'line1\nline2\nline3\nline4');

    const result = await readLines(TEST_FILE, { maxLines: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(['line1', 'line2']);
    }
  });
});

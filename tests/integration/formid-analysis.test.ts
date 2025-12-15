/**
 * Integration tests for FormID analysis feature.
 *
 * Tests the complete FormID analysis pipeline from scan to output.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { formIdDatabase } from '@/lib/database/formid-db.ts';
import { scanCrashLog } from '@/lib/scan-log/index.ts';

const TEST_DB_PATH = path.join(import.meta.dir, '../fixtures/test-formids.db');
const TEMP_LOG_PATH = path.join(import.meta.dir, '../fixtures/temp-crash.log');

// Sample crash log content with FormIDs and plugin list
const SAMPLE_CRASH_LOG = `Fallout 4 v1.10.163
Buffout 4 v1.35.1

Unhandled exception "EXCEPTION_ACCESS_VIOLATION"

CALL STACK:
	[ 0] 0x7FF64A2AFE43 Fallout4.exe+032FE43
	[ 1] FormID: 0x000EAFB6
	[ 2] FormID: 0x0A001234
	[ 3] FormID: 0x0A001234
	[ 4] FormID: 0x000EAFB6
	[ 5] FormID: 0xFF123456

REGISTERS:
	RAX 0x0

PLUGINS:
	[00]     Fallout4.esm
	[01]     DLCRobot.esm
	[0A]     SomeMod.esp
`;

describe('FormID Analysis Integration', () => {
  beforeEach(() => {
    // Write temporary crash log
    fs.writeFileSync(TEMP_LOG_PATH, SAMPLE_CRASH_LOG);

    // Load test database
    formIdDatabase.loadDatabase(TEST_DB_PATH, 'fallout4');
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(TEMP_LOG_PATH)) {
      fs.unlinkSync(TEMP_LOG_PATH);
    }
    formIdDatabase.close();
  });

  test('scanCrashLog includes FormID analysis results', async () => {
    const result = await scanCrashLog({
      logPath: TEMP_LOG_PATH,
      game: 'fallout4',
      verbose: false,
      enableFormIdAnalysis: true,
      showFormIdValues: true,
    });

    expect(result.status).toBe('completed');
    expect(result.formIdAnalysis).toBeDefined();
    expect(result.formIdAnalysis?.matches.length).toBeGreaterThan(0);
    expect(result.formIdAnalysis?.generatorName).toBe('Buffout 4');
  });

  test('FormID analysis resolves plugin names correctly', async () => {
    const result = await scanCrashLog({
      logPath: TEMP_LOG_PATH,
      game: 'fallout4',
      verbose: false,
      enableFormIdAnalysis: true,
    });

    const matches = result.formIdAnalysis?.matches ?? [];

    // Find Fallout4.esm FormID (plugin index 00)
    const fallout4Match = matches.find((m) => m.formId === '000EAFB6');
    expect(fallout4Match).toBeDefined();
    expect(fallout4Match?.plugin).toBe('Fallout4.esm');

    // Find SomeMod.esp FormID (plugin index 0A)
    const modMatch = matches.find((m) => m.formId === '0A001234');
    expect(modMatch).toBeDefined();
    expect(modMatch?.plugin).toBe('SomeMod.esp');
  });

  test('FormID analysis includes database descriptions', async () => {
    const result = await scanCrashLog({
      logPath: TEMP_LOG_PATH,
      game: 'fallout4',
      verbose: false,
      enableFormIdAnalysis: true,
      showFormIdValues: true,
    });

    const matches = result.formIdAnalysis?.matches ?? [];

    // Check for description from database
    const fallout4Match = matches.find((m) => m.formId === '000EAFB6');
    expect(fallout4Match?.description).toBe('GhoulRace');

    const modMatch = matches.find((m) => m.formId === '0A001234');
    expect(modMatch?.description).toBe('ModdedItem');
  });

  test('FormID analysis counts occurrences correctly', async () => {
    const result = await scanCrashLog({
      logPath: TEMP_LOG_PATH,
      game: 'fallout4',
      verbose: false,
      enableFormIdAnalysis: true,
    });

    const matches = result.formIdAnalysis?.matches ?? [];

    // 0A001234 appears twice in the log
    const modMatch = matches.find((m) => m.formId === '0A001234');
    expect(modMatch?.count).toBe(2);

    // 000EAFB6 also appears twice
    const fallout4Match = matches.find((m) => m.formId === '000EAFB6');
    expect(fallout4Match?.count).toBe(2);
  });

  test('FormID analysis filters FF-prefix FormIDs', async () => {
    const result = await scanCrashLog({
      logPath: TEMP_LOG_PATH,
      game: 'fallout4',
      verbose: false,
      enableFormIdAnalysis: true,
    });

    const matches = result.formIdAnalysis?.matches ?? [];

    // FF123456 should be filtered out
    const ffMatch = matches.find((m) => m.formId === 'FF123456');
    expect(ffMatch).toBeUndefined();
  });

  test('FormID analysis can be disabled', async () => {
    const result = await scanCrashLog({
      logPath: TEMP_LOG_PATH,
      game: 'fallout4',
      verbose: false,
      enableFormIdAnalysis: false,
    });

    expect(result.formIdAnalysis).toBeUndefined();
  });

  test('FormID analysis degrades gracefully without database', async () => {
    formIdDatabase.close();

    const result = await scanCrashLog({
      logPath: TEMP_LOG_PATH,
      game: 'fallout4',
      verbose: false,
      enableFormIdAnalysis: true,
      showFormIdValues: true,
    });

    expect(result.formIdAnalysis).toBeDefined();
    expect(result.formIdAnalysis?.databaseAvailable).toBe(false);

    // Should still resolve plugins and count occurrences
    const matches = result.formIdAnalysis?.matches ?? [];
    expect(matches.length).toBeGreaterThan(0);

    // But descriptions should be undefined
    for (const match of matches) {
      expect(match.description).toBeUndefined();
    }
  });

  test('results are sorted by count descending', async () => {
    const result = await scanCrashLog({
      logPath: TEMP_LOG_PATH,
      game: 'fallout4',
      verbose: false,
      enableFormIdAnalysis: true,
    });

    const matches = result.formIdAnalysis?.matches ?? [];

    // Verify sorted by count descending
    for (let i = 1; i < matches.length; i++) {
      const prev = matches[i - 1];
      const curr = matches[i];
      if (prev && curr) {
        expect(prev.count).toBeGreaterThanOrEqual(curr.count);
      }
    }
  });
});

/**
 * Unit tests for FormID analyzer module.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as path from 'node:path';
import { formIdDatabase } from '@/lib/database/formid-db.ts';
import { analyzeFormIds, analyzeFormIdsSync, formatFormIdAnalysis } from '@/lib/formid/analyzer.ts';
import type { LogSegment } from '@/lib/scan-log/index.ts';
import { parsePluginList } from '@/lib/scan-log/plugins.ts';
import type { PluginList } from '@/types/index.ts';

const TEST_DB_PATH = path.join(import.meta.dir, '../../fixtures/test-formids.db');

// Helper to create a test plugin list
function createTestPluginList(): PluginList {
  const segment: LogSegment = {
    type: 'plugins',
    startLine: 0,
    endLine: 5,
    lines: ['\t[00]     Fallout4.esm', '\t[01]     DLCRobot.esm', '\t[0A]     SomeMod.esp'],
  };
  return parsePluginList(segment);
}

describe('analyzeFormIdsSync', () => {
  beforeEach(() => {
    formIdDatabase.loadDatabase(TEST_DB_PATH, 'fallout4');
  });

  afterEach(() => {
    formIdDatabase.close();
  });

  test('analyzes FormIDs with plugin resolution', () => {
    const lines = [
      'FormID: 0x000EAFB6', // Fallout4.esm
      'FormID: 0x0A001234', // SomeMod.esp
    ];
    const pluginList = createTestPluginList();

    const result = analyzeFormIdsSync(lines, pluginList, 'fallout4');

    expect(result.matches).toHaveLength(2);
    expect(result.databaseAvailable).toBe(true);

    const falloutMatch = result.matches.find((m) => m.formId === '000EAFB6');
    expect(falloutMatch?.plugin).toBe('Fallout4.esm');
    expect(falloutMatch?.description).toBe('GhoulRace');

    const modMatch = result.matches.find((m) => m.formId === '0A001234');
    expect(modMatch?.plugin).toBe('SomeMod.esp');
    expect(modMatch?.description).toBe('ModdedItem');
  });

  test('counts multiple occurrences', () => {
    const lines = [
      'FormID: 0x000EAFB6',
      'FormID: 0x000EAFB6',
      'FormID: 0x000EAFB6',
      'FormID: 0x0A001234',
    ];
    const pluginList = createTestPluginList();

    const result = analyzeFormIdsSync(lines, pluginList, 'fallout4');

    expect(result.matches).toHaveLength(2);

    // Should be sorted by count (descending)
    expect(result.matches[0]?.formId).toBe('000EAFB6');
    expect(result.matches[0]?.count).toBe(3);
    expect(result.matches[1]?.formId).toBe('0A001234');
    expect(result.matches[1]?.count).toBe(1);
  });

  test('handles unknown plugin indices', () => {
    const lines = ['FormID: 0x99001234']; // Index 99 not in plugin list
    const pluginList = createTestPluginList();

    const result = analyzeFormIdsSync(lines, pluginList, 'fallout4');

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]?.plugin).toBe('Unknown [99]');
  });

  test('handles empty callstack', () => {
    const pluginList = createTestPluginList();

    const result = analyzeFormIdsSync([], pluginList, 'fallout4');

    expect(result.matches).toHaveLength(0);
    expect(result.databaseAvailable).toBe(true);
  });

  test('includes generator name when provided', () => {
    const lines = ['FormID: 0x000EAFB6'];
    const pluginList = createTestPluginList();

    const result = analyzeFormIdsSync(lines, pluginList, 'fallout4', 'Buffout4');

    expect(result.generatorName).toBe('Buffout4');
  });

  test('works without database loaded', () => {
    formIdDatabase.close();

    const lines = ['FormID: 0x000EAFB6'];
    const pluginList = createTestPluginList();

    const result = analyzeFormIdsSync(lines, pluginList, 'fallout4');

    expect(result.matches).toHaveLength(1);
    expect(result.databaseAvailable).toBe(false);
    expect(result.matches[0]?.description).toBeUndefined();
  });
});

describe('analyzeFormIds (async)', () => {
  afterEach(() => {
    formIdDatabase.close();
  });

  test('loads database automatically when available', async () => {
    const lines = ['FormID: 0x000EAFB6'];
    const pluginList = createTestPluginList();

    const result = await analyzeFormIds(lines, pluginList, {
      game: 'fallout4',
      showFormIdValues: true,
      formIdDatabasePaths: [TEST_DB_PATH],
    });

    expect(result.databaseAvailable).toBe(true);
    expect(result.matches[0]?.description).toBe('GhoulRace');
  });

  test('respects enabled=false config', async () => {
    const lines = ['FormID: 0x000EAFB6'];
    const pluginList = createTestPluginList();

    const result = await analyzeFormIds(lines, pluginList, {
      game: 'fallout4',
      enabled: false,
    });

    expect(result.matches).toHaveLength(0);
    expect(result.databaseAvailable).toBe(false);
  });

  test('respects showFormIdValues=false config', async () => {
    const lines = ['FormID: 0x000EAFB6'];
    const pluginList = createTestPluginList();

    const result = await analyzeFormIds(lines, pluginList, {
      game: 'fallout4',
      showFormIdValues: false,
      formIdDatabasePaths: [TEST_DB_PATH],
    });

    // Should not attempt database lookup
    expect(result.matches[0]?.description).toBeUndefined();
  });
});

describe('formatFormIdAnalysis', () => {
  test('formats matches with descriptions', () => {
    const result = {
      matches: [
        { formId: '000EAFB6', plugin: 'Fallout4.esm', description: 'GhoulRace', count: 3 },
        { formId: '0A001234', plugin: 'SomeMod.esp', description: 'ModdedItem', count: 1 },
      ],
      databaseAvailable: true,
      generatorName: 'Buffout4',
    };

    const lines = formatFormIdAnalysis(result);

    expect(lines[0]).toBe('- Form ID: 000EAFB6 | [Fallout4.esm] | GhoulRace | 3');
    expect(lines[1]).toBe('- Form ID: 0A001234 | [SomeMod.esp] | ModdedItem | 1');
    expect(lines).toContain(
      '[Last number counts how many times each Form ID shows up in the crash log.]'
    );
    expect(lines.some((l) => l.includes('Buffout4'))).toBe(true);
  });

  test('formats matches without descriptions', () => {
    const result = {
      matches: [{ formId: '000EAFB6', plugin: 'Fallout4.esm', count: 2 }],
      databaseAvailable: false,
    };

    const lines = formatFormIdAnalysis(result);

    expect(lines[0]).toBe('- Form ID: 000EAFB6 | [Fallout4.esm] | 2');
  });

  test('handles empty matches', () => {
    const result = {
      matches: [],
      databaseAvailable: false,
    };

    const lines = formatFormIdAnalysis(result);

    expect(lines[0]).toBe("* COULDN'T FIND ANY FORM ID SUSPECTS *");
  });
});

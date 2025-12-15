/**
 * Unit tests for FormID extractor module.
 */

import { describe, expect, test } from 'bun:test';
import {
  FORMID_PATTERN,
  countFormIdOccurrences,
  extractFormIds,
  parsePluginIndex,
  parseRecordId,
  shouldFilterFormId,
} from '@/lib/formid/extractor.ts';

describe('FORMID_PATTERN', () => {
  test('matches standard FormID format', () => {
    FORMID_PATTERN.lastIndex = 0;
    const match = FORMID_PATTERN.exec('FormID: 0x12345678');
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('12345678');
  });

  test('matches with space in "Form ID"', () => {
    FORMID_PATTERN.lastIndex = 0;
    const match = FORMID_PATTERN.exec('Form ID: 0xABCDEF01');
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('ABCDEF01');
  });

  test('matches without colon space', () => {
    FORMID_PATTERN.lastIndex = 0;
    const match = FORMID_PATTERN.exec('FormID:0x00000000');
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('00000000');
  });

  test('is case-insensitive', () => {
    FORMID_PATTERN.lastIndex = 0;
    const match = FORMID_PATTERN.exec('formid: 0xabcdef12');
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('abcdef12');
  });

  test('does not match incomplete FormIDs', () => {
    FORMID_PATTERN.lastIndex = 0;
    const match = FORMID_PATTERN.exec('FormID: 0x1234');
    expect(match).toBeNull();
  });
});

describe('parsePluginIndex', () => {
  test('parses plugin index from first 2 hex digits', () => {
    expect(parsePluginIndex('00123456')).toBe(0);
    expect(parsePluginIndex('0A123456')).toBe(10);
    expect(parsePluginIndex('FF123456')).toBe(255);
    expect(parsePluginIndex('FE123456')).toBe(254);
  });

  test('handles lowercase input', () => {
    expect(parsePluginIndex('ab123456')).toBe(171);
  });
});

describe('parseRecordId', () => {
  test('extracts lower 6 hex digits', () => {
    expect(parseRecordId('0A123456')).toBe('123456');
    expect(parseRecordId('FF000001')).toBe('000001');
  });

  test('returns uppercase', () => {
    expect(parseRecordId('0aabcdef')).toBe('ABCDEF');
  });
});

describe('shouldFilterFormId', () => {
  test('filters FF-prefix FormIDs', () => {
    expect(shouldFilterFormId('FF123456')).toBe(true);
    expect(shouldFilterFormId('FF000000')).toBe(true);
  });

  test('preserves NULL FormID (00000000)', () => {
    expect(shouldFilterFormId('00000000')).toBe(false);
  });

  test('preserves standard plugin FormIDs', () => {
    expect(shouldFilterFormId('00123456')).toBe(false);
    expect(shouldFilterFormId('0A001234')).toBe(false);
    expect(shouldFilterFormId('FE001234')).toBe(false);
  });

  test('handles lowercase input', () => {
    expect(shouldFilterFormId('ff123456')).toBe(true);
    expect(shouldFilterFormId('0a123456')).toBe(false);
  });
});

describe('extractFormIds', () => {
  test('extracts FormIDs from callstack lines', () => {
    const lines = [
      'Some header line',
      'FormID: 0x0A001234',
      'Another line without FormID',
      'Form ID: 0x0B005678',
    ];

    const result = extractFormIds(lines);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      formId: '0A001234',
      pluginIndex: 10,
      recordId: '001234',
      lineNumber: 1,
    });
    expect(result[1]).toEqual({
      formId: '0B005678',
      pluginIndex: 11,
      recordId: '005678',
      lineNumber: 3,
    });
  });

  test('filters FF-prefix FormIDs', () => {
    const lines = ['FormID: 0xFF123456', 'FormID: 0x0A001234', 'FormID: 0xFF000001'];

    const result = extractFormIds(lines);

    expect(result).toHaveLength(1);
    expect(result[0]?.formId).toBe('0A001234');
  });

  test('preserves NULL FormIDs (00000000)', () => {
    const lines = ['FormID: 0x00000000', 'FormID: 0xFF000000'];

    const result = extractFormIds(lines);

    expect(result).toHaveLength(1);
    expect(result[0]?.formId).toBe('00000000');
  });

  test('extracts multiple FormIDs from single line', () => {
    const lines = ['FormID: 0x0A001234 and Form ID: 0x0B005678'];

    const result = extractFormIds(lines);

    expect(result).toHaveLength(2);
    expect(result[0]?.formId).toBe('0A001234');
    expect(result[1]?.formId).toBe('0B005678');
  });

  test('handles empty input', () => {
    expect(extractFormIds([])).toEqual([]);
    expect(extractFormIds(['', '', ''])).toEqual([]);
  });

  test('handles malformed input gracefully', () => {
    const lines = ['FormID: 0x123', 'FormID: invalid', 'Not a FormID at all', 'FormID: 0xGGGGGGGG'];

    const result = extractFormIds(lines);
    expect(result).toEqual([]);
  });

  test('extracts FormIDs from real crash log format', () => {
    const lines = [
      'Object Reference: ',
      'Flags: 0x00000008',
      'FormID: 0x000EAFB6',
      'FormType: kRACE (17)',
    ];

    const result = extractFormIds(lines);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      formId: '000EAFB6',
      pluginIndex: 0,
      recordId: '0EAFB6',
      lineNumber: 2,
    });
  });
});

describe('countFormIdOccurrences', () => {
  test('counts occurrences of each FormID', () => {
    const formIds = extractFormIds([
      'FormID: 0x0A001234',
      'FormID: 0x0B005678',
      'FormID: 0x0A001234',
      'FormID: 0x0A001234',
      'FormID: 0x0B005678',
    ]);

    const counts = countFormIdOccurrences(formIds);

    expect(counts.get('0A001234')).toBe(3);
    expect(counts.get('0B005678')).toBe(2);
  });

  test('handles empty array', () => {
    const counts = countFormIdOccurrences([]);
    expect(counts.size).toBe(0);
  });

  test('handles single FormID', () => {
    const formIds = extractFormIds(['FormID: 0x0A001234']);
    const counts = countFormIdOccurrences(formIds);

    expect(counts.get('0A001234')).toBe(1);
    expect(counts.size).toBe(1);
  });
});

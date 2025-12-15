/**
 * Unit tests for FormID database module.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as path from 'node:path';
import { FormIdDatabaseManager } from '@/lib/database/formid-db.ts';

const TEST_DB_PATH = path.join(import.meta.dir, '../../fixtures/test-formids.db');

describe('FormIdDatabaseManager', () => {
  let dbManager: FormIdDatabaseManager;

  beforeEach(() => {
    dbManager = new FormIdDatabaseManager();
  });

  afterEach(() => {
    dbManager.close();
  });

  describe('loadDatabase', () => {
    test('loads database successfully', () => {
      const result = dbManager.loadDatabase(TEST_DB_PATH, 'fallout4');

      expect(result.success).toBe(true);
      expect(dbManager.hasDatabase('fallout4')).toBe(true);
    });

    test('returns error for non-existent file', () => {
      const result = dbManager.loadDatabase('/nonexistent/path.db', 'fallout4');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Failed to load FormID database');
      }
    });

    test('replaces existing connection', () => {
      dbManager.loadDatabase(TEST_DB_PATH, 'fallout4');
      const result = dbManager.loadDatabase(TEST_DB_PATH, 'fallout4');

      expect(result.success).toBe(true);
      expect(dbManager.hasDatabase('fallout4')).toBe(true);
    });
  });

  describe('lookupFormId', () => {
    beforeEach(() => {
      dbManager.loadDatabase(TEST_DB_PATH, 'fallout4');
    });

    test('finds existing FormID', () => {
      const result = dbManager.lookupFormId('0EAFB6', 'Fallout4.esm', 'fallout4');

      expect(result).toBeDefined();
      expect(result?.entry).toBe('GhoulRace');
      expect(result?.plugin).toBe('Fallout4.esm');
    });

    test('case-insensitive plugin matching', () => {
      const result = dbManager.lookupFormId('0EAFB6', 'fallout4.esm', 'fallout4');

      expect(result).toBeDefined();
      expect(result?.entry).toBe('GhoulRace');
    });

    test('case-insensitive FormID matching', () => {
      const result = dbManager.lookupFormId('0eafb6', 'Fallout4.esm', 'fallout4');

      expect(result).toBeDefined();
      expect(result?.entry).toBe('GhoulRace');
    });

    test('returns undefined for non-existent FormID', () => {
      const result = dbManager.lookupFormId('FFFFFF', 'Fallout4.esm', 'fallout4');

      expect(result).toBeUndefined();
    });

    test('returns undefined for wrong plugin', () => {
      const result = dbManager.lookupFormId('0EAFB6', 'WrongPlugin.esp', 'fallout4');

      expect(result).toBeUndefined();
    });

    test('returns undefined for unloaded game', () => {
      const result = dbManager.lookupFormId('0EAFB6', 'Fallout4.esm', 'skyrim');

      expect(result).toBeUndefined();
    });

    test('caches results', () => {
      // First lookup
      const result1 = dbManager.lookupFormId('0EAFB6', 'Fallout4.esm', 'fallout4');
      // Second lookup should use cache
      const result2 = dbManager.lookupFormId('0EAFB6', 'Fallout4.esm', 'fallout4');

      expect(result1).toEqual(result2);
    });

    test('caches negative results', () => {
      const result1 = dbManager.lookupFormId('FFFFFF', 'Fallout4.esm', 'fallout4');
      const result2 = dbManager.lookupFormId('FFFFFF', 'Fallout4.esm', 'fallout4');

      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
    });
  });

  describe('lookupFormIdBatch', () => {
    beforeEach(() => {
      dbManager.loadDatabase(TEST_DB_PATH, 'fallout4');
    });

    test('batch lookup multiple FormIDs', () => {
      const queries = [
        { formId: '0EAFB6', plugin: 'Fallout4.esm' },
        { formId: '001234', plugin: 'Fallout4.esm' },
        { formId: '001234', plugin: 'SomeMod.esp' },
      ];

      const results = dbManager.lookupFormIdBatch(queries, 'fallout4');

      expect(results.size).toBe(3);
      expect(results.get('0EAFB6:Fallout4.esm')?.entry).toBe('GhoulRace');
      expect(results.get('001234:Fallout4.esm')?.entry).toBe('TestWeapon');
      expect(results.get('001234:SomeMod.esp')?.entry).toBe('ModdedItem');
    });

    test('handles mixed found/not found', () => {
      const queries = [
        { formId: '0EAFB6', plugin: 'Fallout4.esm' },
        { formId: 'FFFFFF', plugin: 'Fallout4.esm' },
      ];

      const results = dbManager.lookupFormIdBatch(queries, 'fallout4');

      expect(results.size).toBe(1);
      expect(results.has('0EAFB6:Fallout4.esm')).toBe(true);
      expect(results.has('FFFFFF:Fallout4.esm')).toBe(false);
    });

    test('handles empty query array', () => {
      const results = dbManager.lookupFormIdBatch([], 'fallout4');

      expect(results.size).toBe(0);
    });

    test('returns empty for unloaded game', () => {
      const queries = [{ formId: '0EAFB6', plugin: 'Fallout4.esm' }];

      const results = dbManager.lookupFormIdBatch(queries, 'skyrim');

      expect(results.size).toBe(0);
    });
  });

  describe('clearCache', () => {
    test('clears cached results', () => {
      dbManager.loadDatabase(TEST_DB_PATH, 'fallout4');

      // Populate cache
      dbManager.lookupFormId('0EAFB6', 'Fallout4.esm', 'fallout4');

      // Clear cache
      dbManager.clearCache();

      // Should still work (re-queries database)
      const result = dbManager.lookupFormId('0EAFB6', 'Fallout4.esm', 'fallout4');
      expect(result?.entry).toBe('GhoulRace');
    });
  });

  describe('close', () => {
    test('closes all connections', () => {
      dbManager.loadDatabase(TEST_DB_PATH, 'fallout4');

      dbManager.close();

      expect(dbManager.hasDatabase('fallout4')).toBe(false);
    });
  });
});

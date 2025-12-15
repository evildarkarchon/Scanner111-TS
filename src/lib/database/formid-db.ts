/**
 * SQLite FormID database module for CLASSIC TypeScript port.
 *
 * Provides SQLite database access for FormID lookups using Bun's native
 * SQLite bindings for high performance.
 */

import { Database } from 'bun:sqlite';
import type { FormIdDatabaseEntry, SupportedGame } from '@/types/index.ts';

/**
 * Result type for database operations.
 */
export type FormIdDbResult<T> = { success: true; data: T } | { success: false; error: string };

/**
 * Query parameters for FormID lookup.
 */
export interface FormIdQuery {
  /** 6-digit record ID (without plugin prefix) */
  formId: string;
  /** Plugin filename for matching */
  plugin: string;
}

/**
 * SQLite-based FormID database manager.
 *
 * Handles loading and querying FormID databases that map game record IDs
 * to human-readable descriptions.
 */
export class FormIdDatabaseManager {
  private connections: Map<string, Database> = new Map();
  private queryCache: Map<string, FormIdDatabaseEntry | null> = new Map();
  private cacheMaxSize = 1000;

  /**
   * Load a FormID database from a file.
   *
   * @param dbPath - Path to the SQLite database file
   * @param game - Game this database is for (used as connection key)
   * @returns Success or error result
   */
  loadDatabase(dbPath: string, game: SupportedGame): FormIdDbResult<void> {
    try {
      // Close existing connection if any
      const existing = this.connections.get(game);
      if (existing) {
        existing.close();
      }

      const db = new Database(dbPath, { readonly: true });
      this.connections.set(game, db);

      return { success: true, data: undefined };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Failed to load FormID database: ${message}` };
    }
  }

  /**
   * Check if a database is loaded for a game.
   *
   * @param game - Game to check
   * @returns True if database is loaded
   */
  hasDatabase(game: SupportedGame): boolean {
    return this.connections.has(game);
  }

  /**
   * Look up a FormID in the database.
   *
   * The database schema has columns: plugin, formid, entry
   * where formid is the 6-digit record ID and plugin is the filename.
   *
   * @param formId - 6-digit record ID (without plugin prefix)
   * @param plugin - Plugin filename to match
   * @param game - Game database to query
   * @returns Database entry if found, or undefined
   */
  lookupFormId(
    formId: string,
    plugin: string,
    game: SupportedGame
  ): FormIdDatabaseEntry | undefined {
    const db = this.connections.get(game);
    if (!db) {
      return undefined;
    }

    // Check cache first
    const cacheKey = `${game}:${plugin}:${formId}`;
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey) ?? undefined;
    }

    try {
      // Get table name based on game
      const tableName = this.getTableName(game);

      // Query with case-insensitive plugin matching
      const stmt = db.prepare(`
        SELECT plugin, formid, entry
        FROM ${tableName}
        WHERE formid = ? AND plugin = ? COLLATE NOCASE
        LIMIT 1
      `);

      const row = stmt.get(formId.toUpperCase(), plugin) as {
        plugin: string;
        formid: string;
        entry: string;
      } | null;

      if (row) {
        const entry: FormIdDatabaseEntry = {
          plugin: row.plugin,
          formId: row.formid,
          entry: row.entry,
        };

        this.addToCache(cacheKey, entry);
        return entry;
      }

      this.addToCache(cacheKey, null);
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Batch lookup multiple FormIDs.
   *
   * More efficient than individual lookups for multiple queries.
   *
   * @param queries - Array of FormID queries
   * @param game - Game database to query
   * @returns Map of "formId:plugin" keys to database entries
   */
  lookupFormIdBatch(queries: FormIdQuery[], game: SupportedGame): Map<string, FormIdDatabaseEntry> {
    const results = new Map<string, FormIdDatabaseEntry>();
    const db = this.connections.get(game);

    if (!db || queries.length === 0) {
      return results;
    }

    // Check cache first, collect uncached queries
    const uncached: FormIdQuery[] = [];
    for (const query of queries) {
      const cacheKey = `${game}:${query.plugin}:${query.formId}`;
      if (this.queryCache.has(cacheKey)) {
        const cached = this.queryCache.get(cacheKey);
        if (cached) {
          results.set(`${query.formId}:${query.plugin}`, cached);
        }
      } else {
        uncached.push(query);
      }
    }

    if (uncached.length === 0) {
      return results;
    }

    try {
      const tableName = this.getTableName(game);

      // Build batch query with parameterized placeholders
      // SQLite doesn't support batch IN with multiple columns efficiently,
      // so we iterate but prepare once
      const stmt = db.prepare(`
        SELECT plugin, formid, entry
        FROM ${tableName}
        WHERE formid = ? AND plugin = ? COLLATE NOCASE
        LIMIT 1
      `);

      for (const query of uncached) {
        const row = stmt.get(query.formId.toUpperCase(), query.plugin) as {
          plugin: string;
          formid: string;
          entry: string;
        } | null;

        const cacheKey = `${game}:${query.plugin}:${query.formId}`;

        if (row) {
          const entry: FormIdDatabaseEntry = {
            plugin: row.plugin,
            formId: row.formid,
            entry: row.entry,
          };
          results.set(`${query.formId}:${query.plugin}`, entry);
          this.addToCache(cacheKey, entry);
        } else {
          this.addToCache(cacheKey, null);
        }
      }

      return results;
    } catch {
      return results;
    }
  }

  /**
   * Clear all cached query results.
   */
  clearCache(): void {
    this.queryCache.clear();
  }

  /**
   * Close all database connections and clear cache.
   */
  close(): void {
    for (const db of this.connections.values()) {
      db.close();
    }
    this.connections.clear();
    this.queryCache.clear();
  }

  /**
   * Get the table name for a game's FormID database.
   *
   * @param game - Game type
   * @returns Table name to query
   */
  private getTableName(game: SupportedGame): string {
    switch (game) {
      case 'fallout4':
        return 'Fallout4';
      case 'skyrim':
        return 'Skyrim';
      default:
        return game;
    }
  }

  /**
   * Add entry to cache with size limit enforcement.
   */
  private addToCache(key: string, value: FormIdDatabaseEntry | null): void {
    // Simple LRU-ish: if cache full, clear half
    if (this.queryCache.size >= this.cacheMaxSize) {
      const keysToDelete = Array.from(this.queryCache.keys()).slice(0, this.cacheMaxSize / 2);
      for (const k of keysToDelete) {
        this.queryCache.delete(k);
      }
    }
    this.queryCache.set(key, value);
  }
}

// Export singleton instance
export const formIdDatabase = new FormIdDatabaseManager();

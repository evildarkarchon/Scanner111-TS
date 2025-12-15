/**
 * Database module for CLASSIC TypeScript port.
 *
 * Manages loading and querying of pattern databases, mod information,
 * and FormID mappings used for crash log analysis.
 */

import { readTextFile } from '@/lib/file-io/index.ts';
import type { DatabaseEntry, SupportedGame } from '@/types/index.ts';
import YAML from 'yaml';

/** Database loading result */
export type DatabaseResult<T> = { success: true; data: T } | { success: false; error: string };

/** Pattern database containing issue detection rules */
export interface PatternDatabase {
  /** Version of the database */
  version: string;
  /** Last updated timestamp */
  lastUpdated: string;
  /** Pattern entries by category */
  patterns: Map<string, DatabaseEntry[]>;
}

/** Mod information entry */
export interface ModEntry {
  /** Mod name */
  name: string;
  /** Nexus mod ID (if available) */
  nexusId?: number;
  /** Known issues with this mod */
  knownIssues?: string[];
  /** Compatible games */
  games: SupportedGame[];
}

/** FormID mapping entry */
export interface FormIdEntry {
  /** FormID in hex format */
  formId: string;
  /** Plugin/mod name */
  plugin: string;
  /** Record type */
  recordType: string;
  /** Editor ID (if available) */
  editorId?: string;
}

/**
 * Database manager for pattern and reference data.
 *
 * Handles loading, caching, and querying of YAML-based databases
 * containing crash patterns, mod information, and FormID mappings.
 */
export class DatabaseManager {
  private patternDb: PatternDatabase | null = null;
  private modEntries: Map<string, ModEntry> = new Map();
  private formIdMap: Map<string, FormIdEntry> = new Map();
  private isLoaded = false;

  /**
   * Load the pattern database from a YAML file.
   *
   * @param filePath - Path to the patterns YAML file
   * @returns Success or error result
   */
  async loadPatternDatabase(filePath: string): Promise<DatabaseResult<PatternDatabase>> {
    const result = await readTextFile(filePath);
    if (!result.success) {
      return result;
    }

    try {
      const parsed = YAML.parse(result.data) as Record<string, unknown>;

      const patterns = new Map<string, DatabaseEntry[]>();

      // Process pattern categories
      if (parsed.patterns && typeof parsed.patterns === 'object') {
        const patternsObj = parsed.patterns as Record<string, unknown[]>;
        for (const [category, entries] of Object.entries(patternsObj)) {
          if (Array.isArray(entries)) {
            patterns.set(category, entries as DatabaseEntry[]);
          }
        }
      }

      this.patternDb = {
        version: String(parsed.version ?? '1.0.0'),
        lastUpdated: String(parsed.lastUpdated ?? new Date().toISOString()),
        patterns,
      };

      this.isLoaded = true;
      return { success: true, data: this.patternDb };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Failed to parse database: ${message}` };
    }
  }

  /**
   * Find patterns matching a given text line.
   *
   * @param line - Text line to match against patterns
   * @param game - Optional game filter
   * @returns Matching database entries
   */
  findMatchingPatterns(line: string, game?: SupportedGame): DatabaseEntry[] {
    if (!this.patternDb) {
      return [];
    }

    const matches: DatabaseEntry[] = [];

    for (const entries of this.patternDb.patterns.values()) {
      for (const entry of entries) {
        // Skip if game filter doesn't match
        if (game && !entry.games.includes(game)) {
          continue;
        }

        try {
          const regex = new RegExp(entry.pattern, 'i');
          if (regex.test(line)) {
            matches.push(entry);
          }
        } catch {
          // Invalid regex pattern, skip
        }
      }
    }

    return matches;
  }

  /**
   * Look up a mod by name.
   *
   * @param modName - Name of the mod to look up
   * @returns Mod entry if found
   */
  lookupMod(modName: string): ModEntry | undefined {
    return this.modEntries.get(modName.toLowerCase());
  }

  /**
   * Look up a FormID.
   *
   * @param formId - FormID to look up (hex string)
   * @returns FormID entry if found
   */
  lookupFormId(formId: string): FormIdEntry | undefined {
    return this.formIdMap.get(formId.toUpperCase());
  }

  /**
   * Check if databases are loaded.
   */
  get loaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Clear all loaded data.
   */
  clear(): void {
    this.patternDb = null;
    this.modEntries.clear();
    this.formIdMap.clear();
    this.isLoaded = false;
  }
}

// Export singleton instance
export const database = new DatabaseManager();

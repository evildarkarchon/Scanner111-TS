/**
 * FormID analyzer module for CLASSIC TypeScript port.
 *
 * Orchestrates FormID extraction, plugin resolution, and database lookups
 * to produce a complete analysis of FormIDs found in crash logs.
 */

import { formIdDatabase } from '@/lib/database/formid-db.ts';
import { findAvailableDatabases } from '@/lib/database/paths.ts';
import { countFormIdOccurrences, extractFormIds } from '@/lib/formid/extractor.ts';
import { pluginIndexToHex, resolvePluginIndex } from '@/lib/formid/resolver.ts';
import type {
  FormIdAnalysisConfig,
  FormIdAnalysisResult,
  FormIdMatch,
  PluginList,
  SupportedGame,
} from '@/types/index.ts';

/**
 * Analyze FormIDs in crash log callstack lines.
 *
 * Performs the complete FormID analysis pipeline:
 * 1. Extract FormIDs from callstack
 * 2. Count occurrences
 * 3. Resolve plugin names from load order
 * 4. Look up descriptions from database (if available)
 *
 * @param callstackLines - Lines from callstack segment of crash log
 * @param pluginList - Parsed plugin list for prefix resolution
 * @param config - Analysis configuration options
 * @returns Complete FormID analysis result
 *
 * @example
 * ```typescript
 * const result = await analyzeFormIds(
 *   callstackLines,
 *   pluginList,
 *   { game: 'fallout4', showFormIdValues: true }
 * );
 * console.log(result.matches);
 * ```
 */
export async function analyzeFormIds(
  callstackLines: string[],
  pluginList: PluginList,
  config: FormIdAnalysisConfig
): Promise<FormIdAnalysisResult> {
  // Check if analysis is disabled
  if (config.enabled === false) {
    return {
      matches: [],
      databaseAvailable: false,
    };
  }

  // Extract FormIDs from callstack
  const extractedFormIds = extractFormIds(callstackLines);

  if (extractedFormIds.length === 0) {
    return {
      matches: [],
      databaseAvailable: false,
    };
  }

  // Count occurrences
  const occurrenceCounts = countFormIdOccurrences(extractedFormIds);

  // Try to load database if not already loaded
  let databaseAvailable = formIdDatabase.hasDatabase(config.game);

  if (!databaseAvailable && config.showFormIdValues !== false) {
    const dbPaths = await findAvailableDatabases(config.game, config.formIdDatabasePaths);
    if (dbPaths.length > 0) {
      const dbPath = dbPaths[0];
      if (dbPath) {
        const loadResult = formIdDatabase.loadDatabase(dbPath, config.game);
        databaseAvailable = loadResult.success;
      }
    }
  }

  // Build matches with plugin resolution and database lookups
  const matches: FormIdMatch[] = [];
  const processedFormIds = new Set<string>();

  for (const extracted of extractedFormIds) {
    // Skip duplicates (we handle counts separately)
    if (processedFormIds.has(extracted.formId)) {
      continue;
    }
    processedFormIds.add(extracted.formId);

    // Resolve plugin name
    const pluginName = resolvePluginIndex(extracted, pluginList);
    const count = occurrenceCounts.get(extracted.formId) ?? 1;

    // Build match entry
    const match: FormIdMatch = {
      formId: extracted.formId,
      plugin: pluginName ?? `Unknown [${pluginIndexToHex(extracted.pluginIndex)}]`,
      count,
    };

    // Look up description from database
    if (databaseAvailable && config.showFormIdValues !== false && pluginName) {
      const dbEntry = formIdDatabase.lookupFormId(extracted.recordId, pluginName, config.game);
      if (dbEntry) {
        match.description = dbEntry.entry;
      }
    }

    matches.push(match);
  }

  // Sort matches by count (descending) for relevance
  matches.sort((a, b) => b.count - a.count);

  return {
    matches,
    databaseAvailable,
  };
}

/**
 * Analyze FormIDs with a pre-loaded database manager.
 *
 * Useful when you want to control database lifecycle externally.
 *
 * @param callstackLines - Lines from callstack segment
 * @param pluginList - Parsed plugin list
 * @param game - Game being analyzed
 * @param generatorName - Optional crash generator name (e.g., "Buffout4")
 * @returns FormID analysis result
 */
export function analyzeFormIdsSync(
  callstackLines: string[],
  pluginList: PluginList,
  game: SupportedGame,
  generatorName?: string
): FormIdAnalysisResult {
  // Check database availability first
  const databaseAvailable = formIdDatabase.hasDatabase(game);

  // Extract FormIDs from callstack
  const extractedFormIds = extractFormIds(callstackLines);

  if (extractedFormIds.length === 0) {
    return {
      matches: [],
      databaseAvailable,
      generatorName,
    };
  }

  // Count occurrences
  const occurrenceCounts = countFormIdOccurrences(extractedFormIds);

  // Build matches
  const matches: FormIdMatch[] = [];
  const processedFormIds = new Set<string>();

  for (const extracted of extractedFormIds) {
    if (processedFormIds.has(extracted.formId)) {
      continue;
    }
    processedFormIds.add(extracted.formId);

    const pluginName = resolvePluginIndex(extracted, pluginList);
    const count = occurrenceCounts.get(extracted.formId) ?? 1;

    const match: FormIdMatch = {
      formId: extracted.formId,
      plugin: pluginName ?? `Unknown [${pluginIndexToHex(extracted.pluginIndex)}]`,
      count,
    };

    if (databaseAvailable && pluginName) {
      const dbEntry = formIdDatabase.lookupFormId(extracted.recordId, pluginName, game);
      if (dbEntry) {
        match.description = dbEntry.entry;
      }
    }

    matches.push(match);
  }

  matches.sort((a, b) => b.count - a.count);

  return {
    matches,
    databaseAvailable,
    generatorName,
  };
}

/**
 * Format FormID analysis result for display.
 *
 * Creates a human-readable summary of the FormID analysis.
 *
 * @param result - Analysis result to format
 * @returns Formatted string lines
 */
export function formatFormIdAnalysis(result: FormIdAnalysisResult): string[] {
  const lines: string[] = [];

  if (result.matches.length === 0) {
    lines.push("* COULDN'T FIND ANY FORM ID SUSPECTS *");
    lines.push('');
    return lines;
  }

  for (const match of result.matches) {
    if (match.description) {
      lines.push(
        `- Form ID: ${match.formId} | [${match.plugin}] | ${match.description} | ${match.count}`
      );
    } else {
      lines.push(`- Form ID: ${match.formId} | [${match.plugin}] | ${match.count}`);
    }
  }

  lines.push('');
  lines.push('[Last number counts how many times each Form ID shows up in the crash log.]');

  if (result.generatorName) {
    lines.push(
      `These Form IDs were caught by ${result.generatorName} and some of them might be related to this crash.`
    );
  }

  lines.push(
    'You can try searching any listed Form IDs in xEdit and see if they lead to relevant records.'
  );
  lines.push('');

  return lines;
}

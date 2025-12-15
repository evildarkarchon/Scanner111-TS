/**
 * Plugin list parser for crash logs.
 *
 * Parses the PLUGINS section of crash logs to extract plugin indices
 * and filenames for FormID resolution.
 */

import type { LogSegment } from '@/lib/scan-log/index.ts';
import type { PluginEntry, PluginList } from '@/types/index.ts';

/**
 * Regex pattern to match plugin entries in crash log format.
 *
 * Matches patterns like:
 * - "[00]     Fallout4.esm"
 * - "[FE:001] LightPlugin.esl"
 * - "[0A]	ModName.esp"
 *
 * Captures: index (e.g., "00", "FE:001") and filename
 */
const PLUGIN_ENTRY_PATTERN = /^\s*\[([0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{3})?)\]\s+(.+?)\s*$/;

/**
 * Parse a single plugin entry line.
 *
 * @param line - Line from plugin list section
 * @returns Parsed plugin entry or undefined if not a valid entry
 */
export function parsePluginEntry(line: string): PluginEntry | undefined {
  const match = line.match(PLUGIN_ENTRY_PATTERN);
  if (!match) {
    return undefined;
  }

  const indexPart = match[1]?.toUpperCase();
  const filename = match[2]?.trim();

  if (!indexPart || !filename) {
    return undefined;
  }

  // Check if this is a light plugin (FE:XXX format)
  const isLight = indexPart.includes(':');

  return {
    index: indexPart,
    filename,
    isLight,
  };
}

/**
 * Parse a plugin list segment from a crash log.
 *
 * Extracts plugin indices and filenames to build a mapping for
 * FormID prefix resolution. Handles both standard plugins (00-FD)
 * and light/ESL plugins (FE:XXX).
 *
 * @param segment - The plugins segment from parseLogSegments
 * @returns Parsed plugin list with index-to-plugin mapping
 *
 * @example
 * ```typescript
 * const segment = {
 *   type: 'plugins',
 *   startLine: 100,
 *   endLine: 200,
 *   lines: [
 *     'PLUGINS:',
 *     '[00]     Fallout4.esm',
 *     '[01]     DLCRobot.esm',
 *   ]
 * };
 * const plugins = parsePluginList(segment);
 * // plugins.plugins.get('00') -> { index: '00', filename: 'Fallout4.esm' }
 * ```
 */
export function parsePluginList(segment: LogSegment | undefined): PluginList {
  const plugins = new Map<string, PluginEntry>();
  const lightPlugins = new Map<string, PluginEntry>();

  if (!segment || segment.type !== 'plugins') {
    return { plugins, lightPlugins, totalCount: 0 };
  }

  for (const line of segment.lines) {
    const entry = parsePluginEntry(line);
    if (!entry) {
      continue;
    }

    if (entry.isLight) {
      lightPlugins.set(entry.index, entry);
    } else {
      plugins.set(entry.index, entry);
    }
  }

  return {
    plugins,
    lightPlugins,
    totalCount: plugins.size + lightPlugins.size,
  };
}

/**
 * Get plugin name by hex index.
 *
 * @param index - Hex plugin index (e.g., "0A", "FE:001")
 * @param pluginList - Parsed plugin list
 * @returns Plugin filename or undefined if not found
 */
export function getPluginByIndex(index: string, pluginList: PluginList): string | undefined {
  const normalizedIndex = index.toUpperCase();

  // Check light plugins first if it's an FE index
  if (normalizedIndex.startsWith('FE')) {
    const lightEntry = pluginList.lightPlugins.get(normalizedIndex);
    if (lightEntry) {
      return lightEntry.filename;
    }
  }

  // Check standard plugins
  const entry = pluginList.plugins.get(normalizedIndex);
  return entry?.filename;
}

/**
 * Convert plugin list to a dictionary format for FormID matching.
 *
 * Returns a mapping of plugin filename to hex index, which is the
 * format expected by the FormID analyzer.
 *
 * @param pluginList - Parsed plugin list
 * @returns Map of plugin filename to hex index
 */
export function pluginListToDict(pluginList: PluginList): Map<string, string> {
  const dict = new Map<string, string>();

  for (const [index, entry] of pluginList.plugins) {
    dict.set(entry.filename, index);
  }

  for (const [index, entry] of pluginList.lightPlugins) {
    dict.set(entry.filename, index);
  }

  return dict;
}

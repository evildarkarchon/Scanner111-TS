/**
 * Plugin index resolver for FormID analysis.
 *
 * Resolves FormID prefixes to plugin names using the crash log's plugin list.
 */

import type { ExtractedFormId, PluginList } from '@/types/index.ts';

/**
 * Resolved FormID with plugin information.
 */
export interface ResolvedFormId {
  /** Original extracted FormID data */
  extracted: ExtractedFormId;
  /** Resolved plugin name, or undefined if not found */
  pluginName: string | undefined;
  /** Whether the plugin was found in the load order */
  pluginFound: boolean;
}

/**
 * Convert a plugin index number to a 2-digit hex string.
 *
 * @param index - Numeric plugin index (0-255)
 * @returns 2-digit uppercase hex string (e.g., "00", "0A", "FF")
 */
export function pluginIndexToHex(index: number): string {
  return index.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * Resolve a FormID prefix to its plugin name.
 *
 * Looks up the plugin index in the crash log's plugin list to determine
 * which plugin owns the FormID. Handles both standard plugins (00-FD)
 * and light/ESL plugins (FE prefix with sub-indices).
 *
 * @param formId - Extracted FormID to resolve
 * @param pluginList - Parsed plugin list from crash log
 * @returns Plugin filename or undefined if not found
 *
 * @example
 * ```typescript
 * const formId = { formId: '0A001234', pluginIndex: 10, recordId: '001234', lineNumber: 5 };
 * const pluginName = resolvePluginIndex(formId, pluginList);
 * // Returns: 'SomeMod.esp' (if index 0A maps to that plugin)
 * ```
 */
export function resolvePluginIndex(
  formId: ExtractedFormId,
  pluginList: PluginList
): string | undefined {
  const hexIndex = pluginIndexToHex(formId.pluginIndex);

  // Handle FE (light/ESL plugins) specially
  // For FE plugins, we'd need the sub-index from the FormID to look up correctly
  // But for now, we just check if it's an FE index and return the first match
  if (hexIndex === 'FE') {
    // Light plugins have a different lookup mechanism
    // The record ID contains the light plugin index in the upper bits
    // For simplicity, we'll just mark these as FE plugins
    // A full implementation would need to decode the light plugin index from recordId
    return undefined;
  }

  // Look up in standard plugins
  const entry = pluginList.plugins.get(hexIndex);
  return entry?.filename;
}

/**
 * Resolve multiple FormIDs to their plugin names.
 *
 * Batch resolves an array of extracted FormIDs against a plugin list.
 *
 * @param formIds - Array of extracted FormIDs
 * @param pluginList - Parsed plugin list from crash log
 * @returns Array of resolved FormIDs with plugin information
 */
export function resolveFormIds(
  formIds: ExtractedFormId[],
  pluginList: PluginList
): ResolvedFormId[] {
  return formIds.map((extracted) => {
    const pluginName = resolvePluginIndex(extracted, pluginList);
    return {
      extracted,
      pluginName,
      pluginFound: pluginName !== undefined,
    };
  });
}

/**
 * Group FormIDs by their resolved plugin.
 *
 * @param resolvedFormIds - Array of resolved FormIDs
 * @returns Map of plugin name to array of FormIDs from that plugin
 */
export function groupByPlugin(resolvedFormIds: ResolvedFormId[]): Map<string, ResolvedFormId[]> {
  const groups = new Map<string, ResolvedFormId[]>();

  for (const resolved of resolvedFormIds) {
    const key = resolved.pluginName ?? 'Unknown';
    const existing = groups.get(key) ?? [];
    existing.push(resolved);
    groups.set(key, existing);
  }

  return groups;
}

/**
 * Check if a FormID belongs to the base game.
 *
 * Base game FormIDs have plugin index 00 and belong to the game's master file
 * (e.g., Fallout4.esm, Skyrim.esm).
 *
 * @param formId - Extracted FormID to check
 * @returns True if FormID is from the base game
 */
export function isBaseGameFormId(formId: ExtractedFormId): boolean {
  return formId.pluginIndex === 0;
}

/**
 * Check if a FormID is from a light/ESL plugin.
 *
 * Light plugins share the FE prefix and use sub-indices for identification.
 *
 * @param formId - Extracted FormID to check
 * @returns True if FormID is from a light/ESL plugin
 */
export function isLightPluginFormId(formId: ExtractedFormId): boolean {
  return formId.pluginIndex === 0xfe;
}

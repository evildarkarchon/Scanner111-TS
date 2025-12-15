/**
 * FormID extraction module for CLASSIC TypeScript port.
 *
 * Extracts FormIDs from crash log callstack segments using regex pattern
 * matching. FormIDs are 8-digit hex identifiers that reference game records.
 */

import type { ExtractedFormId } from '@/types/index.ts';

/**
 * Regex pattern to match FormID format in crash logs.
 *
 * Matches patterns like:
 * - "FormID: 0x12345678"
 * - "Form ID: 0x12345678"
 * - "FormID:0x12345678"
 *
 * Captures the 8-digit hex value without the 0x prefix.
 */
export const FORMID_PATTERN = /Form\s*ID:?\s*0x([0-9A-Fa-f]{8})\b/gi;

/**
 * Parse a hex plugin index from the upper 2 digits of a FormID.
 *
 * @param formId - 8-digit hex FormID string
 * @returns Numeric plugin index (0-255)
 */
export function parsePluginIndex(formId: string): number {
  const prefix = formId.slice(0, 2);
  return Number.parseInt(prefix, 16);
}

/**
 * Parse the record ID (lower 6 digits) from a FormID.
 *
 * @param formId - 8-digit hex FormID string
 * @returns 6-digit hex record ID
 */
export function parseRecordId(formId: string): string {
  return formId.slice(2).toUpperCase();
}

/**
 * Check if a FormID should be filtered out.
 *
 * FormIDs starting with FF are dynamic/runtime-generated and should be
 * skipped as they don't correspond to plugin records. However, we preserve
 * NULL FormIDs (00000000) as they indicate errors.
 *
 * @param formId - 8-digit hex FormID string
 * @returns True if the FormID should be filtered out
 */
export function shouldFilterFormId(formId: string): boolean {
  // Skip if starts with FF (plugin limit / dynamic FormID)
  return formId.toUpperCase().startsWith('FF');
}

/**
 * Extract FormIDs from crash log callstack lines.
 *
 * Scans through each line looking for FormID patterns. Filters out
 * FF-prefix FormIDs (dynamic/runtime) but preserves NULL FormIDs
 * (00000000) as they indicate errors.
 *
 * @param lines - Array of callstack/crash log lines to scan
 * @returns Array of extracted FormID objects with metadata
 *
 * @example
 * ```typescript
 * const lines = [
 *   'FormID: 0x0A001234',
 *   'Some other line',
 *   'Form ID: 0xFF123456', // Will be filtered
 * ];
 * const formIds = extractFormIds(lines);
 * // Returns: [{ formId: '0A001234', pluginIndex: 10, recordId: '001234', lineNumber: 0 }]
 * ```
 */
export function extractFormIds(lines: string[]): ExtractedFormId[] {
  const formIds: ExtractedFormId[] = [];

  if (!lines || lines.length === 0) {
    return formIds;
  }

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const line = lines[lineNumber];
    if (!line) continue;

    // Reset regex lastIndex for global pattern
    FORMID_PATTERN.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = FORMID_PATTERN.exec(line)) !== null) {
      const formIdHex = match[1]?.toUpperCase();
      if (!formIdHex) continue;

      // Skip FF-prefix FormIDs (dynamic/runtime)
      if (shouldFilterFormId(formIdHex)) {
        continue;
      }

      formIds.push({
        formId: formIdHex,
        pluginIndex: parsePluginIndex(formIdHex),
        recordId: parseRecordId(formIdHex),
        lineNumber,
      });
    }
  }

  return formIds;
}

/**
 * Extract unique FormIDs with occurrence counts.
 *
 * Processes extracted FormIDs to count occurrences and deduplicate.
 *
 * @param formIds - Array of extracted FormIDs
 * @returns Map of FormID string to occurrence count
 */
export function countFormIdOccurrences(formIds: ExtractedFormId[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const { formId } of formIds) {
    const current = counts.get(formId) ?? 0;
    counts.set(formId, current + 1);
  }

  return counts;
}

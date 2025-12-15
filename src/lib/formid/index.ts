/**
 * FormID analysis module for CLASSIC TypeScript port.
 *
 * This module provides utilities for extracting, resolving, and analyzing
 * FormIDs from Bethesda game crash logs.
 *
 * @module formid
 */

// Extractor
export {
  FORMID_PATTERN,
  countFormIdOccurrences,
  extractFormIds,
  parsePluginIndex,
  parseRecordId,
  shouldFilterFormId,
} from './extractor.ts';

// Resolver
export {
  groupByPlugin,
  isBaseGameFormId,
  isLightPluginFormId,
  pluginIndexToHex,
  resolveFormIds,
  resolvePluginIndex,
} from './resolver.ts';
export type { ResolvedFormId } from './resolver.ts';

// Analyzer
export { analyzeFormIds, analyzeFormIdsSync, formatFormIdAnalysis } from './analyzer.ts';

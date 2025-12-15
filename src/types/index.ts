/**
 * Core type definitions for CLASSIC TypeScript port.
 *
 * This module defines the shared types used across the application
 * for crash log analysis and game configuration checking.
 */

/** Supported games for crash log analysis */
export type SupportedGame = 'fallout4' | 'skyrim';

/** Message severity levels for the message handler */
export type MessageSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

/** Output modes for scan results */
export type OutputMode = 'cli' | 'gui' | 'file';

/** Scan result status */
export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed';

/** Configuration for crash log scanning */
export interface ScanConfig {
  /** Path to the crash log file */
  logPath: string;
  /** Target game being analyzed */
  game: SupportedGame;
  /** Whether to include verbose output */
  verbose: boolean;
  /** Maximum number of errors to report */
  maxErrors?: number | undefined;
  /** Enable FormID analysis (default: true) */
  enableFormIdAnalysis?: boolean | undefined;
  /** Show FormID descriptions from database (default: true) */
  showFormIdValues?: boolean | undefined;
  /** Custom paths to FormID database files */
  formIdDatabasePaths?: string[] | undefined;
}

/** Result from scanning a crash log */
export interface ScanResult {
  /** Overall status of the scan */
  status: ScanStatus;
  /** List of detected issues */
  issues: Issue[];
  /** Scan metadata */
  metadata: ScanMetadata;
  /** Optional raw output text */
  rawOutput?: string | undefined;
  /** FormID analysis results (if enabled) */
  formIdAnalysis?: FormIdAnalysisResult | undefined;
}

/** Individual issue detected during scan */
export interface Issue {
  /** Unique identifier for the issue type */
  id: string;
  /** Severity of the issue */
  severity: MessageSeverity;
  /** Human-readable title */
  title: string;
  /** Detailed description */
  description: string;
  /** Optional suggested fix */
  suggestion?: string | undefined;
  /** Related mod or plugin (if applicable) */
  relatedMod?: string | undefined;
  /** Line number in crash log (if applicable) */
  lineNumber?: number | undefined;
}

/** Metadata from scan operation */
export interface ScanMetadata {
  /** When the scan started */
  startTime: Date;
  /** When the scan completed */
  endTime?: Date | undefined;
  /** Duration in milliseconds */
  durationMs?: number | undefined;
  /** Path to the scanned file */
  filePath: string;
  /** Game that was detected/specified */
  game: SupportedGame;
  /** Number of lines processed */
  linesProcessed: number;
}

/** Database entry for known issues/patterns */
export interface DatabaseEntry {
  /** Pattern ID */
  id: string;
  /** Regex pattern to match */
  pattern: string;
  /** Issue severity when matched */
  severity: MessageSeverity;
  /** Title to display */
  title: string;
  /** Description template */
  description: string;
  /** Suggestion template */
  suggestion?: string | undefined;
  /** Games this pattern applies to */
  games: SupportedGame[];
}

/** YAML-based configuration settings */
export interface YamlSettings {
  /** Path settings */
  paths?: PathSettings | undefined;
  /** Scanner settings */
  scanner?: ScannerSettings | undefined;
  /** Output settings */
  output?: OutputSettings | undefined;
}

/** Path configuration */
export interface PathSettings {
  /** Game installation directory */
  gameDir?: string | undefined;
  /** Mod organizer directory */
  moDir?: string | undefined;
  /** Documents folder path */
  docsDir?: string | undefined;
}

/** Scanner configuration */
export interface ScannerSettings {
  /** Whether to auto-detect game */
  autoDetectGame: boolean;
  /** Whether to scan subdirectories */
  recursive: boolean;
  /** File patterns to include */
  includePatterns: string[];
}

/** Output configuration */
export interface OutputSettings {
  /** Output format */
  format: 'text' | 'json' | 'markdown';
  /** Whether to colorize CLI output */
  colorize: boolean;
  /** Output file path (if saving to file) */
  outputPath?: string | undefined;
}

// ============================================================================
// FormID Analysis Types
// ============================================================================

/**
 * FormID extracted from a crash log callstack.
 *
 * FormIDs are 8-digit hex identifiers used by Bethesda games to reference
 * records like NPCs, weapons, items, etc. The upper 2 digits indicate the
 * plugin index in the load order.
 */
export interface ExtractedFormId {
  /** Full 8-digit hex FormID (uppercase, without 0x prefix) */
  formId: string;
  /** Plugin index from upper 2 hex digits (0x00-0xFE valid range) */
  pluginIndex: number;
  /** Record ID from lower 6 hex digits */
  recordId: string;
  /** Line number where FormID was found in callstack */
  lineNumber: number;
}

/**
 * Entry from the FormID SQLite database.
 *
 * The database maps FormIDs to human-readable descriptions to help
 * identify which game records are involved in crashes.
 */
export interface FormIdDatabaseEntry {
  /** Plugin that defines this FormID (e.g., "Fallout4.esm") */
  plugin: string;
  /** FormID hex string (6-digit record ID, without plugin prefix) */
  formId: string;
  /** Human-readable description of the record */
  entry: string;
}

/**
 * A matched FormID with resolved plugin and optional database info.
 *
 * Combines extracted FormID data with plugin resolution and database
 * lookup results for reporting.
 */
export interface FormIdMatch {
  /** Full 8-digit FormID with prefix */
  formId: string;
  /** Resolved plugin name from load order */
  plugin: string;
  /** Database entry description (if found) */
  description?: string | undefined;
  /** Number of occurrences in the crash log */
  count: number;
}

/**
 * Complete result of FormID analysis for a crash log.
 */
export interface FormIdAnalysisResult {
  /** All matched FormIDs with plugin resolution */
  matches: FormIdMatch[];
  /** Whether the FormID database was available for lookups */
  databaseAvailable: boolean;
  /** Name of the crash generator (e.g., "Buffout4") */
  generatorName?: string | undefined;
}

/**
 * Configuration options for FormID analysis.
 */
export interface FormIdAnalysisConfig {
  /** Game being analyzed */
  game: SupportedGame;
  /** Whether to show FormID descriptions from database (default: true) */
  showFormIdValues?: boolean | undefined;
  /** Custom paths to FormID database files */
  formIdDatabasePaths?: string[] | undefined;
  /** Enable FormID analysis (default: true) */
  enabled?: boolean | undefined;
}

/**
 * Plugin entry parsed from crash log plugin list.
 */
export interface PluginEntry {
  /** Plugin index in hex (e.g., "00", "0A", "FE") */
  index: string;
  /** Plugin filename (e.g., "Fallout4.esm") */
  filename: string;
  /** Whether this is a light/ESL plugin (FE prefix) */
  isLight?: boolean | undefined;
}

/**
 * Complete plugin list from a crash log.
 *
 * Maps plugin indices to plugin filenames for FormID prefix resolution.
 */
export interface PluginList {
  /** Standard plugins (indices 00-FD) */
  plugins: Map<string, PluginEntry>;
  /** Light/ESL plugins (share FE prefix with sub-indices) */
  lightPlugins: Map<string, PluginEntry>;
  /** Total plugin count */
  totalCount: number;
}

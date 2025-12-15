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

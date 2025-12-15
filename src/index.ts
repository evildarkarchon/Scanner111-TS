/**
 * CLASSIC TypeScript - Main Library Export
 *
 * This module exports all public APIs for the CLASSIC library.
 * Use this for programmatic access to CLASSIC functionality.
 */

// Core types
export type {
  SupportedGame,
  MessageSeverity,
  OutputMode,
  ScanStatus,
  ScanConfig,
  ScanResult,
  Issue,
  ScanMetadata,
  DatabaseEntry,
  YamlSettings,
  PathSettings,
  ScannerSettings,
  OutputSettings,
} from '@/types/index.ts';

// Constants
export { VERSION, APP_NAME, APP_TITLE, CONFIG_FILES, DATABASE_FILES } from '@/lib/constants.ts';

// File I/O
export {
  readTextFile,
  writeTextFile,
  exists,
  getMetadata,
  readLines,
  pathUtils,
  type FileResult,
  type FileMetadata,
} from '@/lib/file-io/index.ts';

// Message Handler
export {
  MessageHandler,
  msgDebug,
  msgInfo,
  msgWarning,
  msgError,
  msgCritical,
  type Message,
  type OutputBackend,
  type MessageHandlerConfig,
} from '@/lib/message-handler/index.ts';

export { CliBackend, type CliBackendConfig } from '@/lib/message-handler/cli-backend.ts';

// Database
export {
  DatabaseManager,
  database,
  type PatternDatabase,
  type ModEntry,
  type FormIdEntry,
} from '@/lib/database/index.ts';

// Scan Log
export {
  scanCrashLog,
  detectGame,
  parseLogSegments,
  type SegmentType,
  type LogSegment,
  type ParsedCrashLog,
} from '@/lib/scan-log/index.ts';

// Utilities
export {
  expandEnvVars,
  formatDuration,
  formatFileSize,
  truncate,
  sleep,
  debounce,
  isWindows,
  getHomeDir,
} from '@/lib/utils/index.ts';

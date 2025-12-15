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
  // FormID types
  ExtractedFormId,
  FormIdDatabaseEntry,
  FormIdMatch,
  FormIdAnalysisResult,
  FormIdAnalysisConfig,
  PluginEntry,
  PluginList,
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

// FormID Analysis
export {
  // Extractor
  FORMID_PATTERN,
  extractFormIds,
  countFormIdOccurrences,
  parsePluginIndex,
  parseRecordId,
  shouldFilterFormId,
  // Resolver
  resolveFormIds,
  resolvePluginIndex,
  pluginIndexToHex,
  groupByPlugin,
  isBaseGameFormId,
  isLightPluginFormId,
  // Analyzer
  analyzeFormIds,
  analyzeFormIdsSync,
  formatFormIdAnalysis,
  type ResolvedFormId,
} from '@/lib/formid/index.ts';

// FormID Database
export {
  FormIdDatabaseManager,
  formIdDatabase,
  type FormIdDbResult,
  type FormIdQuery,
} from '@/lib/database/formid-db.ts';

export {
  getAppDataDirectory,
  getDatabasesDirectory,
  getFormIdDatabasePaths,
  getMainFormIdDatabasePath,
  getLocalFormIdDatabasePath,
  databaseExists,
  findAvailableDatabases,
} from '@/lib/database/paths.ts';

// Plugin List Parser
export {
  parsePluginEntry,
  parsePluginList,
  getPluginByIndex,
  pluginListToDict,
} from '@/lib/scan-log/plugins.ts';

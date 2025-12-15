/**
 * Application-wide constants for CLASSIC TypeScript port.
 *
 * This module contains all constant values used throughout the application,
 * including version info, file patterns, and default configurations.
 */

import type { SupportedGame } from '@/types/index.ts';

/** Application version */
export const VERSION = '0.1.0';

/** Application name */
export const APP_NAME = 'CLASSIC';

/** Full application title */
export const APP_TITLE = 'Crash Log Auto Scanner & Setup Integrity Checker';

/** Default file extensions for crash logs by game */
export const CRASH_LOG_EXTENSIONS: Record<SupportedGame, string[]> = {
  fallout4: ['.log', '.txt'],
  skyrim: ['.log', '.txt'],
};

/** Common crash log file name patterns */
export const CRASH_LOG_PATTERNS: Record<SupportedGame, RegExp[]> = {
  fallout4: [/crash-.*\.log$/i, /Buffout4.*\.log$/i, /crashlog.*\.txt$/i],
  skyrim: [/crash-.*\.log$/i, /NetScriptFramework.*\.log$/i, /crashlog.*\.txt$/i],
};

/** Default directories to search for crash logs */
export const DEFAULT_LOG_DIRECTORIES: Record<SupportedGame, string[]> = {
  fallout4: ['%USERPROFILE%/Documents/My Games/Fallout4/F4SE', '%LOCALAPPDATA%/Fallout4/Logs'],
  skyrim: [
    '%USERPROFILE%/Documents/My Games/Skyrim Special Edition/SKSE',
    '%LOCALAPPDATA%/Skyrim Special Edition/Logs',
  ],
};

/** Configuration file names */
export const CONFIG_FILES = {
  main: 'CLASSIC Main.yaml',
  fallout4: 'CLASSIC Fallout4.yaml',
  skyrim: 'CLASSIC Skyrim.yaml',
  local: 'CLASSIC Local.yaml',
} as const;

/** Database file names */
export const DATABASE_FILES = {
  patterns: 'patterns.yaml',
  mods: 'mods.yaml',
  formIds: 'formids.yaml',
} as const;

/** Default timeout values (in milliseconds) */
export const TIMEOUTS = {
  fileRead: 30_000,
  scan: 60_000,
  databaseLoad: 10_000,
} as const;

/** Maximum file sizes (in bytes) */
export const MAX_FILE_SIZES = {
  crashLog: 50 * 1024 * 1024, // 50 MB
  configFile: 1 * 1024 * 1024, // 1 MB
} as const;

/** Environment variable names */
export const ENV_VARS = {
  configPath: 'CLASSIC_CONFIG_PATH',
  dataPath: 'CLASSIC_DATA_PATH',
  verbose: 'CLASSIC_VERBOSE',
  game: 'CLASSIC_GAME',
} as const;

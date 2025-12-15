/**
 * Database path resolution module.
 *
 * Resolves paths to FormID database files based on platform and game.
 */

import * as os from 'node:os';
import * as path from 'node:path';
import type { SupportedGame } from '@/types/index.ts';

/**
 * Game-specific database file naming patterns.
 */
const DATABASE_NAMES: Record<SupportedGame, { main: string; local: string }> = {
  fallout4: {
    main: 'Fallout4 FormIDs Main.db',
    local: 'Fallout4 FormIDs Local.db',
  },
  skyrim: {
    main: 'Skyrim FormIDs Main.db',
    local: 'Skyrim FormIDs Local.db',
  },
};

/**
 * Get the application data directory.
 *
 * Platform-specific:
 * - Windows: %APPDATA%/CLASSIC
 * - macOS: ~/Library/Application Support/CLASSIC
 * - Linux: ~/.config/CLASSIC
 *
 * @returns Path to application data directory
 */
export function getAppDataDirectory(): string {
  const platform = os.platform();

  if (platform === 'win32') {
    const appData = process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'CLASSIC');
  }

  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'CLASSIC');
  }

  // Linux and others: use XDG_CONFIG_HOME or ~/.config
  const configHome = process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), '.config');
  return path.join(configHome, 'CLASSIC');
}

/**
 * Get the databases directory within app data.
 *
 * @returns Path to databases directory
 */
export function getDatabasesDirectory(): string {
  return path.join(getAppDataDirectory(), 'databases');
}

/**
 * Get paths to FormID database files for a game.
 *
 * Returns paths for both main and local databases. The main database
 * contains shared FormID mappings, while local contains user additions.
 *
 * @param game - Game to get database paths for
 * @returns Array of database file paths (main first, then local)
 */
export function getFormIdDatabasePaths(game: SupportedGame): string[] {
  const dbDir = getDatabasesDirectory();
  const names = DATABASE_NAMES[game];

  return [path.join(dbDir, names.main), path.join(dbDir, names.local)];
}

/**
 * Get the main FormID database path for a game.
 *
 * @param game - Game to get database path for
 * @returns Path to main database file
 */
export function getMainFormIdDatabasePath(game: SupportedGame): string {
  return getFormIdDatabasePaths(game)[0] as string;
}

/**
 * Get the local FormID database path for a game.
 *
 * @param game - Game to get database path for
 * @returns Path to local database file
 */
export function getLocalFormIdDatabasePath(game: SupportedGame): string {
  return getFormIdDatabasePaths(game)[1] as string;
}

/**
 * Check if a database file exists.
 *
 * @param dbPath - Path to database file
 * @returns True if file exists
 */
export async function databaseExists(dbPath: string): Promise<boolean> {
  try {
    const file = Bun.file(dbPath);
    return await file.exists();
  } catch {
    return false;
  }
}

/**
 * Find available FormID databases for a game.
 *
 * Returns only paths to databases that actually exist on disk.
 *
 * @param game - Game to find databases for
 * @param customPaths - Optional custom paths to check in addition to standard locations
 * @returns Array of existing database file paths
 */
export async function findAvailableDatabases(
  game: SupportedGame,
  customPaths?: string[]
): Promise<string[]> {
  const allPaths = [...getFormIdDatabasePaths(game), ...(customPaths ?? [])];
  const available: string[] = [];

  for (const dbPath of allPaths) {
    if (await databaseExists(dbPath)) {
      available.push(dbPath);
    }
  }

  return available;
}

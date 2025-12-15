/**
 * File I/O module for CLASSIC TypeScript port.
 *
 * Provides unified async file operations with proper error handling
 * and encoding support. Uses Bun's native file APIs for performance.
 */

import { stat } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { MAX_FILE_SIZES } from '@/lib/constants.ts';

/** Result type for file operations */
export type FileResult<T> = { success: true; data: T } | { success: false; error: string };

/** File metadata */
export interface FileMetadata {
  path: string;
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  modifiedTime: Date;
  createdTime: Date;
}

/**
 * Read a text file asynchronously.
 *
 * @param filePath - Path to the file to read
 * @param encoding - Text encoding (default: utf-8)
 * @returns File contents as string or error
 */
export async function readTextFile(
  filePath: string,
  _encoding: BufferEncoding = 'utf-8'
): Promise<FileResult<string>> {
  try {
    const resolvedPath = resolve(filePath);
    const file = Bun.file(resolvedPath);

    if (!(await file.exists())) {
      return { success: false, error: `File not found: ${resolvedPath}` };
    }

    const size = file.size;
    if (size > MAX_FILE_SIZES.crashLog) {
      return {
        success: false,
        error: `File too large: ${size} bytes (max: ${MAX_FILE_SIZES.crashLog} bytes)`,
      };
    }

    const content = await file.text();
    return { success: true, data: content };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to read file: ${message}` };
  }
}

/**
 * Write a text file asynchronously.
 *
 * @param filePath - Path to write to
 * @param content - Content to write
 * @returns Success or error result
 */
export async function writeTextFile(filePath: string, content: string): Promise<FileResult<void>> {
  try {
    const resolvedPath = resolve(filePath);
    await Bun.write(resolvedPath, content);
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to write file: ${message}` };
  }
}

/**
 * Check if a file or directory exists.
 *
 * @param path - Path to check
 * @returns True if exists, false otherwise
 */
export async function exists(path: string): Promise<boolean> {
  try {
    const resolvedPath = resolve(path);
    const file = Bun.file(resolvedPath);
    return await file.exists();
  } catch {
    return false;
  }
}

/**
 * Get file metadata.
 *
 * @param filePath - Path to the file
 * @returns File metadata or error
 */
export async function getMetadata(filePath: string): Promise<FileResult<FileMetadata>> {
  try {
    const resolvedPath = resolve(filePath);
    const stats = await stat(resolvedPath);

    return {
      success: true,
      data: {
        path: resolvedPath,
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        modifiedTime: stats.mtime,
        createdTime: stats.birthtime,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to get metadata: ${message}` };
  }
}

/**
 * Read lines from a file with optional filtering.
 *
 * @param filePath - Path to the file
 * @param options - Reading options
 * @returns Array of lines or error
 */
export async function readLines(
  filePath: string,
  options?: {
    /** Skip empty lines */
    skipEmpty?: boolean;
    /** Trim whitespace from lines */
    trim?: boolean;
    /** Maximum number of lines to read */
    maxLines?: number;
  }
): Promise<FileResult<string[]>> {
  const result = await readTextFile(filePath);
  if (!result.success) {
    return result;
  }

  let lines = result.data.split(/\r?\n/);

  if (options?.skipEmpty) {
    lines = lines.filter((line) => line.length > 0);
  }

  if (options?.trim) {
    lines = lines.map((line) => line.trim());
  }

  if (options?.maxLines !== undefined && options.maxLines > 0) {
    lines = lines.slice(0, options.maxLines);
  }

  return { success: true, data: lines };
}

// Re-export path utilities for convenience
export const pathUtils = {
  join,
  resolve,
  dirname,
  basename,
  extname,
};

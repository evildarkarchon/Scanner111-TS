/**
 * Utility functions for CLASSIC TypeScript port.
 *
 * Common helper functions used across the application.
 */

import { homedir } from 'node:os';
import { resolve } from 'node:path';

/**
 * Expand environment variables in a path string.
 *
 * Supports both Unix-style ($VAR, ${VAR}) and Windows-style (%VAR%) variables.
 *
 * @param path - Path string potentially containing environment variables
 * @returns Path with variables expanded
 */
export function expandEnvVars(path: string): string {
  // Handle Windows-style %VAR%
  let expanded = path.replace(/%([^%]+)%/g, (_, varName: string) => {
    if (varName.toUpperCase() === 'USERPROFILE') {
      return homedir();
    }
    return process.env[varName] ?? '';
  });

  // Handle Unix-style $VAR and ${VAR}
  expanded = expanded.replace(/\$\{?(\w+)\}?/g, (_, varName: string) => {
    if (varName === 'HOME' || varName === 'USERPROFILE') {
      return homedir();
    }
    return process.env[varName] ?? '';
  });

  return resolve(expanded);
}

/**
 * Format a duration in milliseconds to a human-readable string.
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted string (e.g., "1.5s", "250ms")
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Format a file size in bytes to a human-readable string.
 *
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB", "256 KB")
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Truncate a string to a maximum length with ellipsis.
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length including ellipsis
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return `${str.slice(0, maxLength - 3)}...`;
}

/**
 * Sleep for a specified duration.
 *
 * @param ms - Duration in milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a debounced version of a function.
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Check if running on Windows.
 */
export function isWindows(): boolean {
  return process.platform === 'win32';
}

/**
 * Get the user's home directory.
 */
export function getHomeDir(): string {
  return homedir();
}

#!/usr/bin/env bun
/**
 * Scanner IPC Entry Point for Tauri Sidecar
 *
 * This module provides a JSON-based IPC interface for the CLASSIC scanner.
 * It reads scan requests from stdin and outputs results to stdout.
 *
 * Protocol:
 * - Input (stdin): JSON object with scan configuration
 * - Output (stdout): JSON object with scan results or error
 *
 * Input format:
 * {
 *   "command": "scan" | "info" | "detect-game",
 *   "logPath": "/path/to/crash.log",  // for scan/detect-game
 *   "game": "fallout4" | "skyrim",    // optional for scan
 *   "verbose": boolean,               // optional
 *   "maxErrors": number               // optional
 * }
 *
 * Output format:
 * {
 *   "success": true,
 *   "result": ScanResult | AppInfo | SupportedGame
 * }
 * or
 * {
 *   "success": false,
 *   "error": "error message"
 * }
 */

import { VERSION, APP_NAME, APP_TITLE } from '@/lib/constants.ts';
import { scanCrashLog, detectGame } from '@/lib/scan-log/index.ts';
import { readTextFile } from '@/lib/file-io/index.ts';
import type { ScanConfig, SupportedGame } from '@/types/index.ts';

/** IPC command types */
type IpcCommand = 'scan' | 'info' | 'detect-game';

/** IPC request structure */
interface IpcRequest {
  command: IpcCommand;
  logPath?: string;
  game?: SupportedGame;
  verbose?: boolean;
  maxErrors?: number;
}

/** IPC success response */
interface IpcSuccessResponse<T> {
  success: true;
  result: T;
}

/** IPC error response */
interface IpcErrorResponse {
  success: false;
  error: string;
}

/** App info structure */
interface AppInfo {
  name: string;
  title: string;
  version: string;
}

/**
 * Send a success response to stdout.
 */
function sendSuccess<T>(result: T): void {
  const response: IpcSuccessResponse<T> = { success: true, result };
  console.log(JSON.stringify(response));
}

/**
 * Send an error response to stdout.
 */
function sendError(error: string): void {
  const response: IpcErrorResponse = { success: false, error };
  console.log(JSON.stringify(response));
}

/**
 * Handle the 'info' command.
 */
function handleInfo(): void {
  const info: AppInfo = {
    name: APP_NAME,
    title: APP_TITLE,
    version: VERSION,
  };
  sendSuccess(info);
}

/**
 * Handle the 'detect-game' command.
 */
async function handleDetectGame(logPath: string): Promise<void> {
  const fileResult = await readTextFile(logPath);

  if (!fileResult.success) {
    sendError(`Failed to read file: ${fileResult.error}`);
    return;
  }

  const game = detectGame(fileResult.data, logPath);

  if (!game) {
    sendError('Could not detect game from crash log');
    return;
  }

  sendSuccess(game);
}

/**
 * Handle the 'scan' command.
 */
async function handleScan(request: IpcRequest): Promise<void> {
  if (!request.logPath) {
    sendError('Missing required field: logPath');
    return;
  }

  // If game not specified, try to detect it
  let game = request.game;
  if (!game) {
    const fileResult = await readTextFile(request.logPath);
    if (fileResult.success) {
      game = detectGame(fileResult.data, request.logPath);
    }
  }

  if (!game) {
    sendError('Could not detect game. Please specify the game explicitly.');
    return;
  }

  const config: ScanConfig = {
    logPath: request.logPath,
    game,
    verbose: request.verbose ?? false,
    maxErrors: request.maxErrors,
  };

  try {
    const result = await scanCrashLog(config);
    sendSuccess(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    sendError(`Scan failed: ${message}`);
  }
}

/**
 * Parse and validate the IPC request.
 */
function parseRequest(input: string): IpcRequest | null {
  try {
    const parsed = JSON.parse(input);

    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }

    if (!parsed.command || typeof parsed.command !== 'string') {
      return null;
    }

    return parsed as IpcRequest;
  } catch {
    return null;
  }
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  // Read input from stdin
  const input = await Bun.stdin.text();
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    sendError('No input provided');
    process.exit(1);
  }

  const request = parseRequest(trimmedInput);

  if (!request) {
    sendError('Invalid JSON input');
    process.exit(1);
  }

  switch (request.command) {
    case 'info':
      handleInfo();
      break;

    case 'detect-game':
      if (!request.logPath) {
        sendError('Missing required field: logPath');
        process.exit(1);
      }
      await handleDetectGame(request.logPath);
      break;

    case 'scan':
      await handleScan(request);
      break;

    default:
      sendError(`Unknown command: ${request.command}`);
      process.exit(1);
  }
}

// Run main
main().catch((err) => {
  sendError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});

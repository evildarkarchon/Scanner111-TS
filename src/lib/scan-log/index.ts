/**
 * Crash Log Scanner module for CLASSIC TypeScript port.
 *
 * Core scanning engine that parses crash logs, detects patterns,
 * and generates diagnostic reports.
 */

import { CRASH_LOG_PATTERNS } from '@/lib/constants.ts';
import { database } from '@/lib/database/index.ts';
import { readTextFile } from '@/lib/file-io/index.ts';
import type { Issue, ScanConfig, ScanMetadata, ScanResult, SupportedGame } from '@/types/index.ts';

/** Segment types in crash logs */
export type SegmentType =
  | 'header'
  | 'callstack'
  | 'registers'
  | 'modules'
  | 'plugins'
  | 'memory'
  | 'unknown';

/** Parsed segment from a crash log */
export interface LogSegment {
  /** Type of segment */
  type: SegmentType;
  /** Starting line number */
  startLine: number;
  /** Ending line number */
  endLine: number;
  /** Raw content lines */
  lines: string[];
}

/** Parsed crash log structure */
export interface ParsedCrashLog {
  /** Detected game */
  game: SupportedGame;
  /** Crash generator (Buffout4, NetScriptFramework, etc.) */
  generator?: string | undefined;
  /** Generator version */
  generatorVersion?: string | undefined;
  /** Parsed segments */
  segments: LogSegment[];
  /** Raw line count */
  totalLines: number;
}

/**
 * Detect the game from crash log content.
 *
 * @param content - Crash log content
 * @param fileName - Optional file name for pattern matching
 * @returns Detected game or undefined
 */
export function detectGame(content: string, fileName?: string): SupportedGame | undefined {
  // Check file name patterns first
  if (fileName) {
    for (const [game, patterns] of Object.entries(CRASH_LOG_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(fileName)) {
          return game as SupportedGame;
        }
      }
    }
  }

  // Check content patterns
  const contentLower = content.toLowerCase();

  if (
    contentLower.includes('fallout4') ||
    contentLower.includes('f4se') ||
    contentLower.includes('buffout4')
  ) {
    return 'fallout4';
  }

  if (
    contentLower.includes('skyrim') ||
    contentLower.includes('skse') ||
    contentLower.includes('netscriptframework')
  ) {
    return 'skyrim';
  }

  return undefined;
}

/**
 * Parse a crash log into segments.
 *
 * @param content - Raw crash log content
 * @param game - Target game
 * @returns Parsed crash log structure
 */
export function parseLogSegments(content: string, game: SupportedGame): ParsedCrashLog {
  const lines = content.split(/\r?\n/);
  const segments: LogSegment[] = [];

  let currentSegment: LogSegment | null = null;
  let generator: string | undefined;
  let generatorVersion: string | undefined;

  // Detect generator from header
  const headerMatch = content.match(
    /(?:Buffout4|NetScriptFramework|Crash Logger)\s*(?:v?(\d+\.\d+(?:\.\d+)?))?/i
  );
  if (headerMatch) {
    generator = headerMatch[0]?.split(/\s+/)[0];
    generatorVersion = headerMatch[1];
  }

  // Simple segment detection based on common patterns
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const lineLower = line.toLowerCase();
    let segmentType: SegmentType = 'unknown';

    // Detect segment type
    if (lineLower.includes('call stack') || lineLower.includes('callstack')) {
      segmentType = 'callstack';
    } else if (lineLower.includes('register') || /^[re][abcd]x\s*:/i.test(line)) {
      segmentType = 'registers';
    } else if (lineLower.includes('modules:') || lineLower.includes('loaded modules')) {
      segmentType = 'modules';
    } else if (lineLower.includes('plugins:') || lineLower.includes('plugin list')) {
      segmentType = 'plugins';
    } else if (i < 20) {
      segmentType = 'header';
    }

    // Handle segment transitions
    if (segmentType !== 'unknown' && (currentSegment === null || segmentType !== currentSegment.type)) {
      if (currentSegment) {
        currentSegment.endLine = i - 1;
        segments.push(currentSegment);
      }
      currentSegment = {
        type: segmentType,
        startLine: i,
        endLine: i,
        lines: [line],
      };
    } else if (currentSegment) {
      currentSegment.lines.push(line);
      currentSegment.endLine = i;
    }
  }

  // Push final segment
  if (currentSegment) {
    segments.push(currentSegment);
  }

  return {
    game,
    generator,
    generatorVersion,
    segments,
    totalLines: lines.length,
  };
}

/**
 * Scan a crash log file and generate a report.
 *
 * @param config - Scan configuration
 * @returns Scan result with detected issues
 */
export async function scanCrashLog(config: ScanConfig): Promise<ScanResult> {
  const startTime = new Date();
  const issues: Issue[] = [];

  // Read the file
  const fileResult = await readTextFile(config.logPath);
  if (!fileResult.success) {
    return {
      status: 'failed',
      issues: [
        {
          id: 'file-read-error',
          severity: 'error',
          title: 'Failed to read crash log',
          description: fileResult.error,
        },
      ],
      metadata: {
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        filePath: config.logPath,
        game: config.game,
        linesProcessed: 0,
      },
    };
  }

  const content = fileResult.data;

  // Detect game if not specified
  const detectedGame = config.game ?? detectGame(content, config.logPath);
  if (!detectedGame) {
    issues.push({
      id: 'game-detection-failed',
      severity: 'warning',
      title: 'Could not detect game',
      description: 'Unable to determine which game this crash log is from',
    });
  }

  const game = detectedGame ?? 'fallout4';

  // Parse segments
  const parsed = parseLogSegments(content, game);

  // Search for patterns
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';

    if (config.maxErrors !== undefined && issues.length >= config.maxErrors) {
      break;
    }

    const matches = database.findMatchingPatterns(line, game);
    for (const match of matches) {
      issues.push({
        id: match.id,
        severity: match.severity,
        title: match.title,
        description: match.description,
        suggestion: match.suggestion,
        lineNumber: i + 1,
      });
    }
  }

  const endTime = new Date();

  const metadata: ScanMetadata = {
    startTime,
    endTime,
    durationMs: endTime.getTime() - startTime.getTime(),
    filePath: config.logPath,
    game,
    linesProcessed: parsed.totalLines,
  };

  return {
    status: 'completed',
    issues,
    metadata,
  };
}


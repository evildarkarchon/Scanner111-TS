#!/usr/bin/env bun
/**
 * CLASSIC CLI Entry Point
 *
 * Command-line interface for the Crash Log Auto Scanner & Setup Integrity Checker.
 * This is the TypeScript port of CLASSIC_ScanLogs.py.
 */

import { resolve } from 'node:path';
import { APP_NAME, APP_TITLE, VERSION } from '@/lib/constants.ts';
import { exists } from '@/lib/file-io/index.ts';
import { CliBackend } from '@/lib/message-handler/cli-backend.ts';
import { MessageHandler } from '@/lib/message-handler/index.ts';
import { scanCrashLog } from '@/lib/scan-log/index.ts';
import { formatDuration } from '@/lib/utils/index.ts';
import type { SupportedGame } from '@/types/index.ts';
import chalk from 'chalk';
import { Command } from 'commander';

// Initialize message handler with CLI backend
const msgHandler = MessageHandler.getInstance({
  outputModes: ['cli'],
  cliConfig: {
    colorize: true,
    showTimestamps: false,
    minSeverity: 'info',
  },
});

msgHandler.registerBackend(
  'cli',
  new CliBackend({
    colorize: true,
    showTimestamps: false,
    minSeverity: 'info',
  })
);

/**
 * Print the application banner.
 */
function printBanner(): void {
  console.log(chalk.cyan.bold(`\n╔${'═'.repeat(60)}╗`));
  console.log(chalk.cyan.bold(`║${APP_NAME.padStart(33).padEnd(60)}║`));
  console.log(chalk.cyan(`║${APP_TITLE.padStart(48).padEnd(60)}║`));
  console.log(chalk.cyan(`║${`Version ${VERSION}`.padStart(37).padEnd(60)}║`));
  console.log(chalk.cyan.bold(`╚${'═'.repeat(60)}╝\n`));
}

/**
 * Shared scan options type.
 */
interface ScanOptions {
  game?: string;
  verbose?: boolean;
  maxErrors?: number;
}

/**
 * Core scan logic - performs the actual scan and returns the result.
 */
async function performScan(
  logPath: string,
  options: ScanOptions,
  outputMode: 'human' | 'json'
): Promise<{ result: Awaited<ReturnType<typeof scanCrashLog>>; resolvedPath: string } | null> {
  const resolvedPath = resolve(logPath);

  // Validate file exists
  if (!(await exists(resolvedPath))) {
    if (outputMode === 'json') {
      console.log(JSON.stringify({ error: `File not found: ${resolvedPath}` }));
    } else {
      console.error(chalk.red(`Error: File not found: ${resolvedPath}`));
    }
    process.exit(1);
  }

  if (outputMode === 'human') {
    console.log(chalk.gray(`Scanning: ${resolvedPath}`));
  }

  const game = options.game as SupportedGame | undefined;

  const result = await scanCrashLog({
    logPath: resolvedPath,
    game: game ?? 'fallout4',
    verbose: options.verbose ?? false,
    maxErrors: options.maxErrors,
  });

  return { result, resolvedPath };
}

/**
 * Handler for human-readable scan output.
 */
async function handleScan(logPath: string, options: ScanOptions): Promise<void> {
  const scanResult = await performScan(logPath, options, 'human');
  if (!scanResult) return;

  const { result } = scanResult;

  // Display results
  console.log(chalk.gray(`\n${'─'.repeat(60)}`));
  console.log(chalk.bold('Scan Results'));
  console.log(chalk.gray(`${'─'.repeat(60)}\n`));

  console.log(chalk.gray(`Status: ${result.status}`));
  console.log(chalk.gray(`Game: ${result.metadata.game}`));
  console.log(chalk.gray(`Lines processed: ${result.metadata.linesProcessed}`));
  console.log(chalk.gray(`Duration: ${formatDuration(result.metadata.durationMs ?? 0)}`));
  console.log(chalk.gray(`Issues found: ${result.issues.length}\n`));

  if (result.issues.length > 0) {
    for (const issue of result.issues) {
      const severityColor =
        issue.severity === 'error' || issue.severity === 'critical'
          ? chalk.red
          : issue.severity === 'warning'
            ? chalk.yellow
            : chalk.blue;

      console.log(severityColor.bold(`[${issue.severity.toUpperCase()}] ${issue.title}`));
      console.log(chalk.white(`  ${issue.description}`));
      if (issue.suggestion) {
        console.log(chalk.green(`  Suggestion: ${issue.suggestion}`));
      }
      if (issue.lineNumber) {
        console.log(chalk.gray(`  Line: ${issue.lineNumber}`));
      }
      console.log('');
    }
  } else {
    console.log(chalk.green('No issues detected'));
  }

  // Display FormID Analysis results
  if (result.formIdAnalysis && result.formIdAnalysis.matches.length > 0) {
    console.log(chalk.gray(`${'─'.repeat(60)}`));
    console.log(chalk.bold.magenta('======== FORM ID SUSPECTS ========'));
    console.log('');

    for (const match of result.formIdAnalysis.matches) {
      if (match.description) {
        console.log(
          chalk.white(`- Form ID: ${chalk.yellow(match.formId)} | `) +
            chalk.cyan(`[${match.plugin}]`) +
            chalk.white(` | ${match.description} | ${match.count}`)
        );
      } else {
        console.log(
          chalk.white(`- Form ID: ${chalk.yellow(match.formId)} | `) +
            chalk.cyan(`[${match.plugin}]`) +
            chalk.white(` | ${match.count}`)
        );
      }
    }

    console.log('');
    console.log(
      chalk.gray('[Last number counts how many times each Form ID shows up in the crash log.]')
    );

    if (result.formIdAnalysis.generatorName) {
      console.log(
        chalk.gray(
          `These Form IDs were caught by ${result.formIdAnalysis.generatorName} and some of them might be related to this crash.`
        )
      );
    }

    console.log(
      chalk.gray(
        'You can try searching any listed Form IDs in xEdit and see if they lead to relevant records.'
      )
    );
    console.log('');
  } else if (result.formIdAnalysis) {
    console.log(chalk.gray(`${'─'.repeat(60)}`));
    console.log(chalk.bold.magenta('======== FORM ID SUSPECTS ========'));
    console.log(chalk.gray("* COULDN'T FIND ANY FORM ID SUSPECTS *"));
    console.log('');
  }
}

/**
 * Handler for JSON output (used by Electron IPC).
 */
async function handleJson(logPath: string, options: ScanOptions): Promise<void> {
  const scanResult = await performScan(logPath, options, 'json');
  if (!scanResult) return;

  console.log(JSON.stringify(scanResult.result));
}

/**
 * Create scan command options (shared between default and scan commands).
 */
function addScanOptions(cmd: Command): Command {
  return cmd
    .option('-g, --game <game>', 'Target game (fallout4 or skyrim)', 'fallout4')
    .option('-v, --verbose', 'Enable verbose output')
    .option('-m, --max-errors <n>', 'Maximum number of errors to report', Number.parseInt);
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  const program = new Command();

  program.name('classic').description(APP_TITLE).version(VERSION);

  // Default command: classic <log-path> (scans with human output)
  const defaultCmd = program
    .argument('[log-path]', 'Path to crash log file')
    .action(async (logPath: string | undefined, options: ScanOptions) => {
      if (logPath) {
        await handleScan(logPath, options);
      } else {
        program.help();
      }
    });
  addScanOptions(defaultCmd);

  // Explicit scan command: classic scan <log-path>
  const scanCmd = program
    .command('scan <log-path>')
    .description('Scan a crash log file for issues')
    .action(handleScan);
  addScanOptions(scanCmd);

  // JSON command: classic json <log-path> (for Electron IPC)
  const jsonCmd = program
    .command('json <log-path>')
    .description('Scan a crash log and output JSON (for programmatic use)')
    .action(handleJson);
  addScanOptions(jsonCmd);

  program
    .command('info')
    .description('Display application information')
    .action(() => {
      console.log(chalk.gray('Runtime: Bun'));
      console.log(chalk.gray(`Platform: ${process.platform}`));
      console.log(chalk.gray(`Node compatibility: ${process.version}`));
    });

  // Show banner unless using json command
  const isJsonMode = process.argv[2] === 'json';
  if (!isJsonMode) {
    printBanner();
  }

  await program.parseAsync(process.argv);
}

// Run main
main().catch((err) => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});

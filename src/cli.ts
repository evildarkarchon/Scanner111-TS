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
 * Main scan command handler.
 */
async function handleScan(
  logPath: string,
  options: { game?: string; verbose?: boolean; maxErrors?: number; json?: boolean }
): Promise<void> {
  const resolvedPath = resolve(logPath);
  const jsonOutput = options.json ?? false;

  // Validate file exists
  if (!(await exists(resolvedPath))) {
    if (jsonOutput) {
      console.log(JSON.stringify({ error: `File not found: ${resolvedPath}` }));
    } else {
      console.error(chalk.red(`Error: File not found: ${resolvedPath}`));
    }
    process.exit(1);
  }

  if (!jsonOutput) {
    console.log(chalk.gray(`Scanning: ${resolvedPath}`));
  }

  const game = options.game as SupportedGame | undefined;

  const result = await scanCrashLog({
    logPath: resolvedPath,
    game: game ?? 'fallout4',
    verbose: options.verbose ?? false,
    maxErrors: options.maxErrors,
  });

  // JSON output mode - for Electron IPC
  if (jsonOutput) {
    console.log(JSON.stringify(result));
    return;
  }

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
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  const program = new Command();

  program.name('classic').description(APP_TITLE).version(VERSION);

  program
    .command('scan <log-path>')
    .description('Scan a crash log file for issues')
    .option('-g, --game <game>', 'Target game (fallout4 or skyrim)', 'fallout4')
    .option('-v, --verbose', 'Enable verbose output')
    .option('-m, --max-errors <n>', 'Maximum number of errors to report', Number.parseInt)
    .option('-j, --json', 'Output results as JSON (for programmatic use)')
    .action(handleScan);

  program
    .command('info')
    .description('Display application information')
    .action(() => {
      console.log(chalk.gray('Runtime: Bun'));
      console.log(chalk.gray(`Platform: ${process.platform}`));
      console.log(chalk.gray(`Node compatibility: ${process.version}`));
    });

  // Show banner unless JSON output mode
  const isJsonMode = process.argv.includes('--json') || process.argv.includes('-j');
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

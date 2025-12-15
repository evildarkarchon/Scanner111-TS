/**
 * CLI Output Backend for Message Handler.
 *
 * Provides colorized console output for CLI mode with
 * configurable severity filtering and formatting.
 */

import type { MessageSeverity } from '@/types/index.ts';
import chalk from 'chalk';
import type { CliBackendConfig, Message, OutputBackend } from './index.ts';

// Re-export for convenience
export type { CliBackendConfig };

const SEVERITY_ORDER: Record<MessageSeverity, number> = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
  critical: 4,
};

const SEVERITY_COLORS: Record<MessageSeverity, (text: string) => string> = {
  debug: chalk.gray,
  info: chalk.blue,
  warning: chalk.yellow,
  error: chalk.red,
  critical: chalk.bgRed.white,
};

const SEVERITY_LABELS: Record<MessageSeverity, string> = {
  debug: 'DEBUG',
  info: 'INFO',
  warning: 'WARN',
  error: 'ERROR',
  critical: 'CRITICAL',
};

/**
 * CLI output backend implementation.
 *
 * Formats messages for console output with optional colorization
 * and timestamp display.
 */
export class CliBackend implements OutputBackend {
  private config: CliBackendConfig;

  constructor(config: CliBackendConfig) {
    this.config = config;
  }

  /**
   * Format and send a message to the console.
   */
  send(message: Message): void {
    if (!this.shouldDisplay(message.severity)) {
      return;
    }

    const formatted = this.formatMessage(message);

    // Use appropriate console method based on severity
    switch (message.severity) {
      case 'error':
      case 'critical':
        console.error(formatted);
        break;
      case 'warning':
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  /**
   * Flush output (no-op for console).
   */
  flush(): void {
    // Console output is immediate, nothing to flush
  }

  /**
   * Dispose resources (no-op for console).
   */
  dispose(): void {
    // No resources to clean up
  }

  /**
   * Check if message severity meets minimum threshold.
   */
  private shouldDisplay(severity: MessageSeverity): boolean {
    return SEVERITY_ORDER[severity] >= SEVERITY_ORDER[this.config.minSeverity];
  }

  /**
   * Format a message for console display.
   */
  private formatMessage(message: Message): string {
    const parts: string[] = [];

    // Add timestamp if configured
    if (this.config.showTimestamps) {
      const timestamp = message.timestamp.toISOString().slice(11, 19);
      parts.push(this.config.colorize ? chalk.gray(`[${timestamp}]`) : `[${timestamp}]`);
    }

    // Add severity label
    const label = SEVERITY_LABELS[message.severity];
    const colorFn = SEVERITY_COLORS[message.severity];
    parts.push(this.config.colorize ? colorFn(`[${label}]`) : `[${label}]`);

    // Add category if present
    if (message.category) {
      parts.push(
        this.config.colorize ? chalk.cyan(`[${message.category}]`) : `[${message.category}]`
      );
    }

    // Add message content
    parts.push(message.content);

    return parts.join(' ');
  }
}

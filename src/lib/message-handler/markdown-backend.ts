/**
 * Markdown Output Backend for Message Handler.
 *
 * Provides markdown-formatted output for report generation,
 * including special handling for FormID analysis results.
 */

import type { FormIdAnalysisResult, MessageSeverity, ScanResult } from '@/types/index.ts';
import type { Message, OutputBackend } from './index.ts';

/**
 * Configuration for Markdown backend.
 */
export interface MarkdownBackendConfig {
  /** Minimum severity to include in output */
  minSeverity: MessageSeverity;
  /** Include timestamps in output */
  includeTimestamps?: boolean;
  /** Include table of contents */
  includeToc?: boolean;
}

const SEVERITY_ORDER: Record<MessageSeverity, number> = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
  critical: 4,
};

const SEVERITY_EMOJI: Record<MessageSeverity, string> = {
  debug: '',
  info: 'i',
  warning: '!',
  error: 'X',
  critical: 'XX',
};

/**
 * Markdown output backend implementation.
 *
 * Accumulates messages and formats them as Markdown for export.
 */
export class MarkdownBackend implements OutputBackend {
  private config: MarkdownBackendConfig;
  private messages: Message[] = [];

  constructor(config: MarkdownBackendConfig) {
    this.config = config;
  }

  /**
   * Accumulate a message for later formatting.
   */
  send(message: Message): void {
    if (!this.shouldInclude(message.severity)) {
      return;
    }
    this.messages.push(message);
  }

  /**
   * Get accumulated messages as Markdown.
   */
  getMarkdown(): string {
    const lines: string[] = [];

    for (const message of this.messages) {
      const emoji = SEVERITY_EMOJI[message.severity];
      const prefix = emoji ? `[${emoji}] ` : '';

      if (this.config.includeTimestamps) {
        const timestamp = message.timestamp.toISOString().slice(11, 19);
        lines.push(`- ${prefix}**${timestamp}**: ${message.content}`);
      } else {
        lines.push(`- ${prefix}${message.content}`);
      }
    }

    return lines.join('\n');
  }

  flush(): void {
    // Nothing to flush - messages are accumulated
  }

  dispose(): void {
    this.messages = [];
  }

  private shouldInclude(severity: MessageSeverity): boolean {
    return SEVERITY_ORDER[severity] >= SEVERITY_ORDER[this.config.minSeverity];
  }
}

/**
 * Format FormID analysis results as Markdown.
 *
 * @param result - FormID analysis result
 * @returns Markdown formatted string
 */
export function formatFormIdAnalysisMarkdown(result: FormIdAnalysisResult): string {
  const lines: string[] = [];

  lines.push('## Form ID Suspects');
  lines.push('');

  if (result.matches.length === 0) {
    lines.push("*COULDN'T FIND ANY FORM ID SUSPECTS*");
    lines.push('');
    return lines.join('\n');
  }

  // Table header
  lines.push('| Form ID | Plugin | Description | Count |');
  lines.push('|---------|--------|-------------|-------|');

  // Table rows
  for (const match of result.matches) {
    const formId = `\`${match.formId}\``;
    const plugin = match.plugin;
    const description = match.description ?? '-';
    const count = match.count.toString();

    lines.push(`| ${formId} | ${plugin} | ${description} | ${count} |`);
  }

  lines.push('');

  // Footer note
  lines.push('> **Note:** The count shows how many times each Form ID appears in the crash log.');

  if (result.generatorName) {
    lines.push(
      `> These Form IDs were caught by ${result.generatorName} and some may be related to this crash.`
    );
  }

  lines.push('> You can search these Form IDs in xEdit to find the relevant records.');
  lines.push('');

  return lines.join('\n');
}

/**
 * Format a complete scan result as Markdown report.
 *
 * @param result - Complete scan result
 * @returns Full Markdown report
 */
export function formatScanResultMarkdown(result: ScanResult): string {
  const lines: string[] = [];

  // Header
  lines.push('# CLASSIC Crash Log Analysis Report');
  lines.push('');

  // Metadata
  lines.push('## Scan Summary');
  lines.push('');
  lines.push(`- **Status:** ${result.status}`);
  lines.push(`- **Game:** ${result.metadata.game}`);
  lines.push(`- **File:** ${result.metadata.filePath}`);
  lines.push(`- **Lines Processed:** ${result.metadata.linesProcessed}`);
  lines.push(`- **Duration:** ${result.metadata.durationMs ?? 0}ms`);
  lines.push(`- **Issues Found:** ${result.issues.length}`);
  lines.push('');

  // Issues section
  if (result.issues.length > 0) {
    lines.push('## Detected Issues');
    lines.push('');

    for (const issue of result.issues) {
      const severityBadge = getSeverityBadge(issue.severity);
      lines.push(`### ${severityBadge} ${issue.title}`);
      lines.push('');
      lines.push(issue.description);

      if (issue.suggestion) {
        lines.push('');
        lines.push(`**Suggestion:** ${issue.suggestion}`);
      }

      if (issue.lineNumber) {
        lines.push('');
        lines.push(`*Line: ${issue.lineNumber}*`);
      }

      lines.push('');
    }
  } else {
    lines.push('## Detected Issues');
    lines.push('');
    lines.push('No issues detected.');
    lines.push('');
  }

  // FormID Analysis section
  if (result.formIdAnalysis) {
    lines.push(formatFormIdAnalysisMarkdown(result.formIdAnalysis));
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push('*Generated by CLASSIC TypeScript*');

  return lines.join('\n');
}

/**
 * Get a Markdown badge for issue severity.
 */
function getSeverityBadge(severity: MessageSeverity): string {
  switch (severity) {
    case 'critical':
      return '**[CRITICAL]**';
    case 'error':
      return '**[ERROR]**';
    case 'warning':
      return '*[WARNING]*';
    case 'info':
      return '[INFO]';
    case 'debug':
      return '[DEBUG]';
    default:
      return '';
  }
}

/**
 * Message Handler module for CLASSIC TypeScript port.
 *
 * This module provides centralized message handling for all output modes
 * (CLI, GUI, file logging). It mirrors the Python MessageHandler architecture.
 */

import type { MessageSeverity, OutputMode } from '@/types/index.ts';

/** Message payload structure */
export interface Message {
  /** Message severity level */
  severity: MessageSeverity;
  /** Message content */
  content: string;
  /** Optional category/source */
  category?: string | undefined;
  /** Timestamp when message was created */
  timestamp: Date;
}

/** Output backend interface */
export interface OutputBackend {
  /** Send a message to this backend */
  send(message: Message): void;
  /** Flush any buffered output */
  flush(): void;
  /** Clean up resources */
  dispose(): void;
}

/** CLI output backend configuration */
export interface CliBackendConfig {
  /** Whether to colorize output */
  colorize: boolean;
  /** Whether to include timestamps */
  showTimestamps: boolean;
  /** Minimum severity to display */
  minSeverity: MessageSeverity;
}

/** Message handler configuration */
export interface MessageHandlerConfig {
  /** Active output modes */
  outputModes: OutputMode[];
  /** CLI-specific configuration */
  cliConfig?: CliBackendConfig;
  /** File output path */
  logFilePath?: string;
}

const SEVERITY_ORDER: Record<MessageSeverity, number> = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
  critical: 4,
};

/**
 * Central message handler for all application output.
 *
 * Provides a unified interface for sending messages to different
 * output backends (CLI, GUI, file) with consistent formatting.
 */
export class MessageHandler {
  private static instance: MessageHandler | null = null;
  private backends: Map<OutputMode, OutputBackend> = new Map();
  private config: MessageHandlerConfig;

  private constructor(config: MessageHandlerConfig) {
    this.config = config;
  }

  /**
   * Get or create the singleton instance.
   */
  static getInstance(config?: MessageHandlerConfig): MessageHandler {
    if (!MessageHandler.instance) {
      MessageHandler.instance = new MessageHandler(
        config ?? {
          outputModes: ['cli'],
          cliConfig: {
            colorize: true,
            showTimestamps: false,
            minSeverity: 'info',
          },
        }
      );
    }
    return MessageHandler.instance;
  }

  /**
   * Reset the singleton instance (primarily for testing).
   */
  static reset(): void {
    if (MessageHandler.instance) {
      MessageHandler.instance.dispose();
      MessageHandler.instance = null;
    }
  }

  /**
   * Register an output backend.
   */
  registerBackend(mode: OutputMode, backend: OutputBackend): void {
    this.backends.set(mode, backend);
  }

  /**
   * Send a message to all registered backends.
   */
  send(severity: MessageSeverity, content: string, category?: string): void {
    const message: Message = {
      severity,
      content,
      category,
      timestamp: new Date(),
    };

    for (const [mode, backend] of this.backends) {
      if (this.config.outputModes.includes(mode)) {
        backend.send(message);
      }
    }
  }

  /** Send a debug message */
  debug(content: string, category?: string): void {
    this.send('debug', content, category);
  }

  /** Send an info message */
  info(content: string, category?: string): void {
    this.send('info', content, category);
  }

  /** Send a warning message */
  warning(content: string, category?: string): void {
    this.send('warning', content, category);
  }

  /** Send an error message */
  error(content: string, category?: string): void {
    this.send('error', content, category);
  }

  /** Send a critical message */
  critical(content: string, category?: string): void {
    this.send('critical', content, category);
  }

  /**
   * Flush all backends.
   */
  flush(): void {
    for (const backend of this.backends.values()) {
      backend.flush();
    }
  }

  /**
   * Dispose all backends and clean up resources.
   */
  dispose(): void {
    for (const backend of this.backends.values()) {
      backend.dispose();
    }
    this.backends.clear();
  }

  /**
   * Check if a severity level should be displayed.
   */
  shouldDisplay(severity: MessageSeverity, minSeverity: MessageSeverity): boolean {
    return SEVERITY_ORDER[severity] >= SEVERITY_ORDER[minSeverity];
  }
}

// Convenience functions for direct usage
const handler = MessageHandler.getInstance();

export const msgDebug = (content: string, category?: string): void =>
  handler.debug(content, category);
export const msgInfo = (content: string, category?: string): void =>
  handler.info(content, category);
export const msgWarning = (content: string, category?: string): void =>
  handler.warning(content, category);
export const msgError = (content: string, category?: string): void =>
  handler.error(content, category);
export const msgCritical = (content: string, category?: string): void =>
  handler.critical(content, category);

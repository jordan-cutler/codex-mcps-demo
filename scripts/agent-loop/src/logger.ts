import { LogEntry } from './types';

/**
 * Logger component for the agent loop
 */
export class Logger {
  private logs: LogEntry[] = [];
  private isEnabled: boolean;
  private logLevel: 'debug' | 'info' | 'warn' | 'error';
  private levelPriority: Record<'debug' | 'info' | 'warn' | 'error', number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  /**
   * Creates a new Logger instance
   *
   * @param enabled Whether logging is enabled
   * @param level Minimum log level to record
   */
  constructor(
    enabled = true,
    level: 'debug' | 'info' | 'warn' | 'error' = 'info',
  ) {
    this.isEnabled = enabled;
    this.logLevel = level;
  }

  /**
   * Log a debug message
   *
   * @param component Component name
   * @param message Log message
   * @param data Optional data to include
   */
  debug(
    component: string,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    this.log('debug', component, message, data);
  }

  /**
   * Log an info message
   *
   * @param component Component name
   * @param message Log message
   * @param data Optional data to include
   */
  info(
    component: string,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    this.log('info', component, message, data);
  }

  /**
   * Log a warning message
   *
   * @param component Component name
   * @param message Log message
   * @param data Optional data to include
   */
  warn(
    component: string,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    this.log('warn', component, message, data);
  }

  /**
   * Log an error message
   *
   * @param component Component name
   * @param message Log message
   * @param data Optional data to include
   */
  error(
    component: string,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    this.log('error', component, message, data);
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Generic logging method
   */
  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    component: string,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    if (
      !this.isEnabled ||
      this.levelPriority[level] < this.levelPriority[this.logLevel]
    ) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      component,
      message,
      data,
    };

    this.logs.push(entry);

    // Also output to console for immediate feedback
    const consoleMethod =
      level === 'debug'
        ? console.debug
        : level === 'info'
          ? console.info
          : level === 'warn'
            ? console.warn
            : console.error;

    const formattedTime = entry.timestamp.toISOString();
    consoleMethod(
      `[${formattedTime}] [${level.toUpperCase()}] [${component}] ${message}`,
    );

    if (data) {
      consoleMethod('Data:', JSON.stringify(data, null, 2));
    }
  }
}

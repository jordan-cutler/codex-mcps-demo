import { Logger } from './logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleSpies: { [key: string]: jest.SpyInstance };

  beforeEach(() => {
    // Create spies for console methods
    consoleSpies = {
      debug: jest.spyOn(console, 'debug').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
    };

    // Create a new logger instance for each test
    logger = new Logger(true, 'info');
  });

  afterEach(() => {
    // Restore console methods
    Object.values(consoleSpies).forEach((spy) => spy.mockRestore());
  });

  it('should create a new Logger instance with default settings', () => {
    const defaultLogger = new Logger();
    expect(defaultLogger).toBeInstanceOf(Logger);
    expect(defaultLogger.getLogs()).toEqual([]);
  });

  it('should log messages at different levels', () => {
    // Debug level should be filtered out at info level
    logger.debug('TestComponent', 'Debug message');
    expect(consoleSpies.debug).not.toHaveBeenCalled();
    expect(logger.getLogs()).toHaveLength(0);

    // Info level should be logged
    logger.info('TestComponent', 'Info message');
    expect(consoleSpies.info).toHaveBeenCalled();
    expect(logger.getLogs()).toHaveLength(1);
    expect(logger.getLogs()[0].level).toBe('info');
    expect(logger.getLogs()[0].component).toBe('TestComponent');
    expect(logger.getLogs()[0].message).toBe('Info message');

    // Warning level should be logged
    logger.warn('TestComponent', 'Warning message');
    expect(consoleSpies.warn).toHaveBeenCalled();
    expect(logger.getLogs()).toHaveLength(2);
    expect(logger.getLogs()[1].level).toBe('warn');

    // Error level should be logged
    logger.error('TestComponent', 'Error message');
    expect(consoleSpies.error).toHaveBeenCalled();
    expect(logger.getLogs()).toHaveLength(3);
    expect(logger.getLogs()[2].level).toBe('error');
  });

  it('should respect logging level settings', () => {
    // Create a logger with debug level
    const debugLogger = new Logger(true, 'debug');

    // Debug level should now be logged
    debugLogger.debug('TestComponent', 'Debug message');
    expect(consoleSpies.debug).toHaveBeenCalled();
    expect(debugLogger.getLogs()).toHaveLength(1);

    // Create a logger with error level
    const errorLogger = new Logger(true, 'error');

    // Only error level should be logged
    errorLogger.debug('TestComponent', 'Debug message');
    errorLogger.info('TestComponent', 'Info message');
    errorLogger.warn('TestComponent', 'Warning message');
    errorLogger.error('TestComponent', 'Error message');

    expect(errorLogger.getLogs()).toHaveLength(1);
    expect(errorLogger.getLogs()[0].level).toBe('error');
  });

  it('should disable logging when enabled is false', () => {
    // Create a disabled logger
    const disabledLogger = new Logger(false);

    // No messages should be logged
    disabledLogger.debug('TestComponent', 'Debug message');
    disabledLogger.info('TestComponent', 'Info message');
    disabledLogger.warn('TestComponent', 'Warning message');
    disabledLogger.error('TestComponent', 'Error message');

    expect(disabledLogger.getLogs()).toHaveLength(0);
    expect(consoleSpies.debug).not.toHaveBeenCalled();
    expect(consoleSpies.info).not.toHaveBeenCalled();
    expect(consoleSpies.warn).not.toHaveBeenCalled();
    expect(consoleSpies.error).not.toHaveBeenCalled();
  });

  it('should include timestamp and data in log entries', () => {
    const testData = { key: 'value' };
    logger.info('TestComponent', 'Message with data', testData);

    const log = logger.getLogs()[0];
    expect(log.timestamp).toBeInstanceOf(Date);
    expect(log.data).toEqual(testData);
  });

  it('should clear logs when clearLogs is called', () => {
    logger.info('TestComponent', 'Test message');
    expect(logger.getLogs()).toHaveLength(1);

    logger.clearLogs();
    expect(logger.getLogs()).toHaveLength(0);
  });
});

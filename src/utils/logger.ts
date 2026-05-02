/**
 * Secure Logger Utility
 * 
 * Provides structured logging with automatic redaction of sensitive data.
 * Prevents API keys, tokens, and other secrets from appearing in logs.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  /**
   * Additional context data to log (will be redacted for sensitive fields)
   */
  data?: any;
  /**
   * Whether to force logging even in production
   */
  forceLog?: boolean;
}

/**
 * Sensitive field patterns to redact from logs
 */
const SENSITIVE_PATTERNS = [
  /api[_-]?key/i,
  /token/i,
  /secret/i,
  /password/i,
  /auth/i,
  /bearer/i,
];

/**
 * Redact sensitive data from log output
 */
function redactSensitiveData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'string') {
    // Don't redact short strings, likely not sensitive
    return data.length > 50 ? '[REDACTED]' : data;
  }
  
  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }
  
  if (typeof data === 'object') {
    const redacted: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Check if key matches sensitive patterns
      const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
      redacted[key] = isSensitive ? '[REDACTED]' : redactSensitiveData(value);
    }
    return redacted;
  }
  
  return data;
}

/**
 * Format log message with timestamp and level
 */
function formatMessage(level: LogLevel, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (data) {
    const safeData = redactSensitiveData(data);
    return `${prefix} ${message} ${JSON.stringify(safeData, null, 2)}`;
  }
  
  return `${prefix} ${message}`;
}

/**
 * Determine if logging should occur based on environment
 */
function shouldLog(level: LogLevel, forceLog?: boolean): boolean {
  // Always log in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // In production, only log warnings and errors (unless forced)
  if (process.env.NODE_ENV === 'production') {
    return forceLog || level === 'warn' || level === 'error';
  }
  
  return true;
}

/**
 * Secure logger with automatic sensitive data redaction
 */
export const logger = {
  /**
   * Log informational messages
   */
  info(message: string, options?: LogOptions): void {
    if (shouldLog('info', options?.forceLog)) {
      console.log(formatMessage('info', message, options?.data));
    }
  },
  
  /**
   * Log warning messages
   */
  warn(message: string, options?: LogOptions): void {
    if (shouldLog('warn', options?.forceLog)) {
      console.warn(formatMessage('warn', message, options?.data));
    }
  },
  
  /**
   * Log error messages
   */
  error(message: string, error?: Error | unknown, options?: LogOptions): void {
    if (shouldLog('error', options?.forceLog)) {
      const errorData = error instanceof Error 
        ? { message: error.message, stack: error.stack, ...options?.data }
        : { error, ...options?.data };
      
      console.error(formatMessage('error', message, errorData));
    }
  },
  
  /**
   * Log debug messages (development only)
   */
  debug(message: string, options?: LogOptions): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message, options?.data));
    }
  },
};

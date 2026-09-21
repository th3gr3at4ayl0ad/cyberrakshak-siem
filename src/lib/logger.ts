export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  meta?: Record<string, unknown>;
  timestamp: string;
}

function formatLog(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level}]`;
  const ctx = entry.context ? ` [${entry.context}]` : "";
  const meta = entry.meta ? ` ${JSON.stringify(entry.meta)}` : "";
  return `${base}${ctx} ${entry.message}${meta}`;
}

function createLog(level: LogLevel, context?: string) {
  return (message: string, meta?: Record<string, unknown>) => {
    const entry: LogEntry = {
      level,
      message,
      context,
      meta,
      timestamp: new Date().toISOString(),
    };

    const formatted = formatLog(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV === "development") {
          console.debug(formatted);
        }
        break;
      default:
        console.log(formatted);
    }
  };
}

export const logger = {
  debug: createLog(LogLevel.DEBUG),
  info: createLog(LogLevel.INFO),
  warn: createLog(LogLevel.WARN),
  error: createLog(LogLevel.ERROR),

  child: (context: string) => ({
    debug: createLog(LogLevel.DEBUG, context),
    info: createLog(LogLevel.INFO, context),
    warn: createLog(LogLevel.WARN, context),
    error: createLog(LogLevel.ERROR, context),
  }),
};

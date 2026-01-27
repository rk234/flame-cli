import {
  createConsola,
  type ConsolaInstance,
  type ConsolaReporter,
  type LogObject,
  type ConsolaOptions,
} from "consola";

export type LogLevel = "quiet" | "normal" | "verbose" | "debug";

const levelMap: Record<LogLevel, number> = {
  quiet: 1, // Only errors
  normal: 3, // info, warn, error
  verbose: 4, // + debug
  debug: 5, // + trace
};

/**
 * Custom reporter wrapper that removes extra newlines from badge-style logs
 */
function createCompactReporter(baseReporter: ConsolaReporter): ConsolaReporter {
  return {
    log(logObj: LogObject, ctx: { options: ConsolaOptions }) {
      // Override badge to false to prevent extra newlines
      const modifiedLogObj = {
        ...logObj,
        badge: false,
      };
      baseReporter.log(modifiedLogObj, ctx);
    },
  };
}

export function createLogger(level: LogLevel = "normal"): ConsolaInstance {
  // Create a base consola instance to get its default reporter
  const baseConsola = createConsola({ level: levelMap[level] });

  // Get the default reporters and wrap them
  const wrappedReporters = baseConsola.options.reporters.map(
    createCompactReporter,
  );

  return createConsola({
    level: levelMap[level],
    reporters: wrappedReporters,
  });
}

// Default logger instance
export const logger = createLogger();

// Create a scoped logger for a specific component
export function scopedLogger(scope: string, level?: LogLevel): ConsolaInstance {
  const base = level ? createLogger(level) : logger;
  return base.withTag(scope);
}

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

// Log levels that should be suppressed in non-interactive mode
// Level 0 = fatal/error, Level 1 = warn, Level 2 = log, Level 3 = info/success/etc.
const INTERACTIVE_ONLY_MIN_LEVEL = 1; // Suppress warn (1) and above, keep fatal/error (0)

/**
 * Custom reporter wrapper that:
 * 1. Removes extra newlines from badge-style logs
 * 2. Suppresses non-critical messages when stdout is not a TTY (piped)
 */
function createCompactReporter(baseReporter: ConsolaReporter): ConsolaReporter {
  return {
    log(logObj: LogObject, ctx: { options: ConsolaOptions }) {
      // Check TTY at log time, not at creation time
      const isTTY = process.stdout?.isTTY ?? false;

      // In non-interactive mode, only show fatal/error messages (level 0)
      if (!isTTY && logObj.level >= INTERACTIVE_ONLY_MIN_LEVEL) {
        return;
      }

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

import ora, { type Options, type Ora } from "ora";
import chalk from "chalk";
import stripAnsi from "strip-ansi";

export interface SpinnerOptions {
  text?: string;
  successText?: string | ((result: unknown) => string);
  failText?: string | ((error: Error) => string);
}

export interface Spinner {
  promise: <T>(
    action: Promise<T> | (() => Promise<T>),
    options?: string | SpinnerOptions,
  ) => Promise<T>;
}

/**
 * Gets the visible length of a string (excluding ANSI codes)
 */
function visibleLength(str: string): number {
  return stripAnsi(str).length;
}

/**
 * Creates right-aligned text with padding to push suffix to the right edge
 */
function createRightAlignedText(
  text: string,
  suffix: string,
  columns: number,
): string {
  // Account for spinner prefix (2 chars: spinner + space)
  const spinnerPrefix = 2;
  const availableWidth = columns - spinnerPrefix;
  const textLen = visibleLength(text);
  const suffixLen = visibleLength(suffix);

  // Calculate padding needed (minimum 1 space between text and suffix)
  const paddingNeeded = Math.max(1, availableWidth - textLen - suffixLen);

  return `${text}${" ".repeat(paddingNeeded)}${suffix}`;
}

/**
 * Creates a spinner instance with right-aligned environment suffix text.
 * @param useEmulator - Whether the emulator is being used
 * @returns Spinner instance with pre-configured suffix
 */
export function createSpinner(useEmulator: boolean): Spinner {
  const suffix = chalk.bold.blueBright(useEmulator ? "[emulator]" : "[remote]");

  return {
    promise: async <T>(
      action: Promise<T> | (() => Promise<T>),
      options?: string | SpinnerOptions,
    ): Promise<T> => {
      const opts: SpinnerOptions =
        typeof options === "string" ? { text: options } : (options ?? {});

      const baseText = opts.text ?? "";
      const columns = process.stdout.columns || 80;

      const spinner = ora({
        text: createRightAlignedText(baseText, suffix, columns),
      }).start();

      try {
        const result = await (typeof action === "function" ? action() : action);

        // Handle success text
        let successText = baseText;
        if (opts.successText) {
          successText =
            typeof opts.successText === "function"
              ? opts.successText(result)
              : opts.successText;
        }

        spinner.succeed(createRightAlignedText(successText, suffix, columns));
        return result;
      } catch (error) {
        // Handle fail text
        let failText = baseText;
        if (opts.failText) {
          failText =
            typeof opts.failText === "function"
              ? opts.failText(error as Error)
              : opts.failText;
        }

        spinner.fail(createRightAlignedText(failText, suffix, columns));
        throw error;
      }
    },
  };
}

import type { CommandContext } from "@stricli/core";
import type { StricliAutoCompleteContext } from "@stricli/auto-complete";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  loadConfig,
  loadFirebaseConfig,
  writeConfig,
  type FirebaseConfig,
  type FlameConfig,
} from "./config/loader";
import type { Firestore } from "firebase-admin/firestore";
import { getFirebaseClient } from "./services/firestore";
import chalk from "chalk";
import type { ConsolaInstance } from "consola";
import { logger } from "./services/logger";
import { createSpinner, type Spinner } from "./services/spinner";

export interface LocalContext
  extends CommandContext, StricliAutoCompleteContext {
  readonly process: NodeJS.Process;
  readonly getConfig: () => { config: FlameConfig; path: string | null };
  readonly tryGetConfig: () => {
    config: FlameConfig;
    path: string | null;
  } | null;
  readonly tryGetFirebaseConfig: () => FirebaseConfig | null;
  readonly getFirestore: () => Firestore;
  readonly logger: () => ConsolaInstance;
  readonly spinner: () => Spinner;
}

function tryWriteLoadedConfig(cwd: string) {
  try {
    const { config, path } = loadConfig(cwd);

    if (!path) {
      writeConfig(cwd, config);
    }
  } catch {
    logger.verbose("Could not infer/load config!");
  }
}

export function buildContext(process: NodeJS.Process): LocalContext {
  try {
    tryWriteLoadedConfig(process.cwd());
    return {
      process,
      os,
      fs,
      path,
      logger: () => {
        try {
          const { config } = loadConfig(process.cwd());
          return logger.withTag(
            chalk.bold.blueBright(
              config.useEmulator ? "[emulator]" : "[remote]",
            ),
          );
        } catch {
          return logger;
        }
      },
      spinner: () => {
        try {
          const { config } = loadConfig(process.cwd());
          return createSpinner(config.useEmulator);
        } catch {
          return createSpinner(false);
        }
      },
      tryGetFirebaseConfig: () => {
        try {
          return loadFirebaseConfig(process.cwd());
        } catch {
          return null;
        }
      },
      getConfig: () => loadConfig(process.cwd()),
      getFirestore: () => getFirebaseClient(loadConfig(process.cwd()).config),
      tryGetConfig: () => {
        try {
          return loadConfig(process.cwd());
        } catch {
          return null;
        }
      },
    };
  } catch (err) {
    if (err instanceof Error) {
      logger.error(err.message);
    } else {
      logger.error("Something went wrong", err);
    }
    process.exit(1);
  }
}

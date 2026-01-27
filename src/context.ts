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
import { logger } from "./services/logger";

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

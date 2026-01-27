import type { CommandContext } from "@stricli/core";
import type { StricliAutoCompleteContext } from "@stricli/auto-complete";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadConfig, type FlameConfig } from "./config/loader";
import type { Firestore } from "firebase-admin/firestore";
import { getFirebaseClient } from "./services/firestore";
import chalk from "chalk";

export interface LocalContext
  extends CommandContext, StricliAutoCompleteContext {
  readonly process: NodeJS.Process;
  readonly config: FlameConfig;
  readonly firestore: Firestore;
}

export function buildContext(process: NodeJS.Process): LocalContext {
  try {
    const config = loadConfig(process.cwd());
    const firestore = getFirebaseClient(config);

    return {
      process,
      os,
      fs,
      path,
      config,
      firestore,
    };
  } catch (err) {
    if (err instanceof Error) {
      console.log(`${chalk.redBright("ERROR")}: ${err.message}`);
    } else {
      console.log(`${chalk.redBright("ERROR")}: Something went wrong`);
      console.error(err);
    }
    process.exit(1);
  }
}

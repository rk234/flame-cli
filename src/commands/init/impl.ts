import type { LocalContext } from "../../context";
import { logger } from "../../services/logger";
import {
  CONFIG_FILE,
  writeConfig,
  type FlameConfig,
} from "../../config/loader";
import path from "path/win32";

export default async function init(this: LocalContext) {
  logger.start("Initializing flame...");
  const { config, path: existingConfPath } = this.tryGetConfig() ?? {
    config: null,
    path: null,
  };

  if (existingConfPath) {
    logger.success("Flame config file already exists at " + existingConfPath);
    return;
  }

  if (config) {
    const confPath = this.tryGetFirebaseConfig()?.path ?? this.process.cwd();
    logger.info("Config inferred from firebase project");
    writeConfig(confPath, config);
    logger.success(
      `Flame config file successfully created ${path.join(confPath, CONFIG_FILE)}`,
    );
    return;
  }

  logger.warn(
    "Could not infer config. Make sure a firebase project exists in a parent directory!",
  );
  logger.warn("Will create config file at " + process.cwd());

  const useEmulator = await logger.prompt("Default to firestore emulator?", {
    type: "confirm",
  });
  const project = await logger.prompt("Firebase project ID:", { type: "text" });
  const emulatorHost = await logger.prompt("Firestore emulator host:", {
    type: "text",
    default: "127.0.0.1",
  });
  const emulatorPort = await logger.prompt("Firestore emulator port:", {
    type: "text",
    default: "8080",
  });

  try {
    if (!project) throw new Error("No project name specified!");
    const config: FlameConfig = {
      project,
      emulatorHost,
      emulatorPort: parseInt(emulatorPort),
      useEmulator,
    };

    writeConfig(process.cwd(), config);
    logger.success(
      `Flame config file successfully created ${path.join(process.cwd(), CONFIG_FILE)}`,
    );
  } catch (err) {
    if (err instanceof Error) {
      logger.error("Failed to parse inputted config: " + err.message);
    } else {
      logger.error("Failed to parse inputted config!");
    }
  }
}

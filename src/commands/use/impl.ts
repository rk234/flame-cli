import type { LocalContext } from "../../context";
import { writeConfig } from "../../config/loader";
import path from "node:path";

type Target = "remote" | "emulator";

export default function use(this: LocalContext, _: {}, target: Target) {
  const logger = this.logger();
  const { config } = this.tryGetConfig() ?? { config: null };

  if (!config) {
    logger.error(
      "Could not infer or load flame config. Make sure to run flame init!",
    );
    return;
  }

  const useEmulator = target === "emulator";

  const updatedConfig = {
    ...config,
    useEmulator,
  };

  const currentConfigPath = this.tryGetConfig()?.path;

  if (!currentConfigPath) {
    logger.error("No config file found!");
    return;
  }

  writeConfig(path.dirname(currentConfigPath), updatedConfig);

  if (useEmulator) {
    logger.success(
      `Switched to emulator at ${updatedConfig.emulatorHost}:${updatedConfig.emulatorPort}`,
    );
  } else {
    logger.success(
      `Switched to remote Firestore for project: ${updatedConfig.project}`,
    );
  }
}

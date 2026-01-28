import type { LocalContext } from "../../context";
import { version } from "../../../package.json";
import chalk from "chalk";

export default function status(this: LocalContext) {
  const logger = this.logger();
  logger.log(
    `🔥 ${chalk.bold.hex("#FFA500")("FLAME")} ${chalk.greenBright(`v${version}`)}`,
  );
  console.log();

  logger.info(`${chalk.bold("Node version:")} ${this.process.version}`);

  const { config, path } = this.tryGetConfig() ?? { config: null, path: null };

  if (config) {
    const { project, useEmulator, emulatorHost, emulatorPort } = config;
    logger.info(`${chalk.bold("Firebase project:")} ${project}`);
    logger.info(
      `${chalk.bold("Using emulator?")} ${useEmulator ? "Yes" : "No"}`,
    );
    logger.info(
      `${chalk.bold("Emulator host & port:")} ${emulatorHost}:${emulatorPort}`,
    );
    logger.info(`${chalk.bold("Active config path:")} ${path ?? "unknown"}`);
  } else {
    logger.warn("No flame config file found. Run flame init to create one.");
  }
}

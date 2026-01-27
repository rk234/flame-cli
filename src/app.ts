import { buildApplication, buildRouteMap } from "@stricli/core";
import {
  buildInstallCommand,
  buildUninstallCommand,
} from "@stricli/auto-complete";
import { version, description } from "../package.json";
import { upCommand } from "./commands/up/command";
import { downCommand } from "./commands/down/command";
import { statusCommand } from "./commands/status/command";
import { initCommand } from "./commands/init/command";
import { useCommand } from "./commands/use/command";
import chalk from "chalk";

const routes = buildRouteMap({
  routes: {
    init: initCommand,
    status: statusCommand,
    use: useCommand,
    up: upCommand,
    down: downCommand,
    install: buildInstallCommand("flame", {
      bash: "__flame-cli_bash_complete",
    }),
    uninstall: buildUninstallCommand("flame", { bash: true }),
  },
  docs: {
    brief: `🔥 ${chalk.bold.hex("#FFA500")("FLAME")} ${chalk.greenBright(`v${version}`)}\n${description}`,
    hideRoute: {
      install: true,
      uninstall: true,
    },
  },
});

export const app = buildApplication(routes, {
  name: "flame",
  versionInfo: {
    currentVersion: version,
  },
});

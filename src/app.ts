import { buildApplication, buildRouteMap } from "@stricli/core";
import { buildInstallCommand, buildUninstallCommand } from "@stricli/auto-complete";
import { name, version, description } from "../package.json";
import { upCommand } from "./commands/up/command";

const routes = buildRouteMap({
    routes: {
        up: upCommand,
        install: buildInstallCommand("flame-cli", { bash: "__flame-cli_bash_complete" }),
        uninstall: buildUninstallCommand("flame-cli", { bash: true }),
    },
    docs: {
        brief: description,
        hideRoute: {
            install: true,
            uninstall: true,
        },
    },
});

export const app = buildApplication(routes, {
    name,
    versionInfo: {
        currentVersion: version,
    },
});

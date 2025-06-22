import { buildApplication, buildRouteMap } from "@stricli/core";
import { buildInstallCommand, buildUninstallCommand } from "@stricli/auto-complete";
import { version, description } from "../package.json";
import { upCommand } from "./commands/up/command";
import { projectRoutes } from "./commands/project/commands";

const routes = buildRouteMap({
    routes: {
        up: upCommand,
        project: projectRoutes,
        install: buildInstallCommand("flame", { bash: "__flame-cli_bash_complete" }),
        uninstall: buildUninstallCommand("flame", { bash: true }),
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
    name: "flame",
    versionInfo: {
        currentVersion: version,
    },
});

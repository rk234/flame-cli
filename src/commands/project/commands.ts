import { buildCommand, buildRouteMap } from "@stricli/core";
import { logger } from "../../services/logger";

export const listCommand = buildCommand({
  docs: { brief: "Lists registered projects" },
  func: () => logger.info("Listing registered projects..."),
  parameters: {},
});

export const projectRoutes = buildRouteMap({
  docs: {
    brief: "Project actions",
  },
  routes: {
    list: listCommand,
  },
});

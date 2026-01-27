import { buildCommand } from "@stricli/core";

export const initCommand = buildCommand({
  loader: async () => import("./impl"),
  parameters: {},
  docs: {
    brief: "Initialize flame for the current firebase project",
  },
});

import { buildCommand } from "@stricli/core";

export const statusCommand = buildCommand({
  loader: async () => import("./impl"),
  parameters: {},
  docs: {
    brief: "Display flame configuration status",
  },
});

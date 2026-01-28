import { buildCommand, buildChoiceParser } from "@stricli/core";

export const collectionsCommand = buildCommand({
  loader: async () => import("./impl"),
  parameters: {},
  docs: {
    brief: "List all collections",
  },
});

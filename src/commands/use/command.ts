import { buildCommand, buildChoiceParser } from "@stricli/core";

const targetParser = buildChoiceParser(["remote", "emulator"] as const);

export const useCommand = buildCommand({
  loader: async () => import("./impl"),
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          placeholder: "target",
          brief: "Target environment: 'remote' or 'emulator'",
          parse: targetParser,
        },
      ],
    },
  },
  docs: {
    brief: "Switch between remote Firestore and local emulator",
  },
});

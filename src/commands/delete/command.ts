import { buildCommand } from "@stricli/core";

export const deleteCommand = buildCommand({
  loader: async () => import("./impl"),
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          placeholder: "path",
          brief:
            "Document or collection path (e.g., 'users' or 'users/abc123')",
          parse: String,
        },
      ],
    },
    flags: {
      force: {
        kind: "boolean",
        brief: "Skip confirmation prompt",
        optional: true,
      },
    },
    aliases: {
      f: "force",
    },
  },
  docs: {
    brief: "Delete a document or all documents in a collection",
  },
});

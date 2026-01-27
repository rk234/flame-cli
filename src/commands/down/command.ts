import { buildCommand } from "@stricli/core";

export const downCommand = buildCommand({
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
      format: {
        kind: "enum",
        brief: "Output format",
        values: ["json", "table"],
        default: "json",
      },
      limit: {
        kind: "parsed",
        brief: "Maximum number of documents to return (for collections)",
        parse: Number,
        optional: true,
      },
    },
    aliases: {
      f: "format",
      l: "limit",
    },
  },
  docs: {
    brief: "Download and display documents from Firestore",
  },
});

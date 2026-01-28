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
      limit: {
        kind: "parsed",
        brief: "Maximum number of documents to return (for collections)",
        parse: Number,
        optional: true,
      },
      docId: {
        kind: "boolean",
        brief: "Include _id field for the document id",
        optional: true,
      },
    },
    aliases: {
      l: "limit",
    },
  },
  docs: {
    brief: "Download and display documents from Firestore",
  },
});

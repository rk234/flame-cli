import { buildCommand } from "@stricli/core";

export const moveCommand = buildCommand({
  loader: async () => import("./impl"),
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          placeholder: "source",
          brief:
            "Document or collection path (e.g., 'users' or 'users/abc123')",
          parse: String,
        },
        {
          placeholder: "destination",
          brief:
            "Document or collection path (e.g., 'users' or 'users/abc123')",
          parse: String,
        },
      ],
    },
    flags: {
      idField: {
        kind: "parsed",
        brief: "The field to set as the document ID in the copied document",
        optional: true,
        parse: String,
      },
    },
  },
  docs: {
    brief: "Copy a document to the specified path",
  },
});

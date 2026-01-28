import { buildCommand } from "@stricli/core";

export const upCommand = buildCommand({
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
      data: {
        kind: "parsed",
        brief: "JSON document data to upload",
        optional: true,
        parse: String,
      },
      merge: {
        kind: "boolean",
        brief: "Merge with existing document if it exists",
        optional: true,
      },
      idField: {
        kind: "parsed",
        brief: "JSON document data to upload",
        optional: true,
        parse: String,
      },
    },
  },
  docs: {
    brief: "Upload data to a collection",
  },
});

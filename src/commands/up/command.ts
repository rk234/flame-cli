import { buildCommand } from "@stricli/core";

export const upCommand = buildCommand({
    loader: async () => import("./impl"),
    parameters: {
    },
    docs: {
        brief: "Upload data to a collection",
    },
});

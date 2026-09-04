import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";

export default defineConfig({
  extends: [core, react],
  ignorePatterns: ["env.d.ts"],
  rules: {
    "react/react-in-jsx-scope": "off",
  },
});

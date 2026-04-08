import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  globalIgnores([
    "dist/**",
    "build/**",
    "contracts/managed/**",
  ]),
]);

export default eslintConfig;

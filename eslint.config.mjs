import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const config = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["packages/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_"
        }
      ]
    }
  },
  {
    ignores: ["**/dist/**", "**/coverage/**", "**/.next/**"]
  }
);

export default config;

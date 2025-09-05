import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import eslintComments from "eslint-plugin-eslint-comments";

export default [
  {
    ...js.configs.recommended,
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.es2021 },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      react: pluginReact,
      import: importPlugin,
      "eslint-comments": eslintComments,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      ...eslintComments.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
      'import/resolver': {
        typescript: {
          project: [
            "./tsconfig.json",
            "./app/tsconfig.json",
            "./cli/tsconfig.json",
            "./components/tsconfig.json",
            "./hooks/tsconfig.json",
            "./lib/tsconfig.json",
            "./test/tsconfig.json",
            "./types/tsconfig.json",
            "./utils/tsconfig.json",
          ],
        },
        node: true,
      },
    },
  },
  {
    files: ["bin/*"],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2021 },
    },
  },
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat["jsx-runtime"],
];

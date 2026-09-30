// ESLint flat config (ESLint 9+/10).
// Replaces the legacy .eslintrc.js, which extended the unmaintained
// `eslint-config-google` (incompatible with ESLint 9+ because it references
// removed core rules such as `valid-jsdoc`/`require-jsdoc`). The stylistic
// rules below reproduce the Google style rules the codebase relies on.
import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
      ignores: ["lib/**", "node_modules/**"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      files: ["**/*.{ts,js,mjs}"],
      languageOptions: {
        ecmaVersion: 2023,
        sourceType: "module",
        globals: {
          ...globals.node,
        },
      },
      plugins: {
        "@stylistic": stylistic,
      },
      rules: {
      // Google style (from eslint-config-google), via @stylistic.
        "@stylistic/array-bracket-newline": "off",
        "@stylistic/array-bracket-spacing": ["error", "never"],
        "@stylistic/block-spacing": ["error", "never"],
        "@stylistic/brace-style": "error",
        "@stylistic/comma-dangle": ["error", {
          arrays: "always-multiline",
          objects: "always-multiline",
          imports: "always-multiline",
          exports: "always-multiline",
          functions: "ignore",
        }],
        "@stylistic/comma-spacing": "error",
        "@stylistic/comma-style": "error",
        "@stylistic/computed-property-spacing": "error",
        "@stylistic/eol-last": "error",
        "@stylistic/function-call-spacing": "error",
        "@stylistic/indent": ["error", 2, {
          CallExpression: {arguments: 2},
          FunctionDeclaration: {body: 1, parameters: 2},
          FunctionExpression: {body: 1, parameters: 2},
          MemberExpression: 2,
          ObjectExpression: 1,
          SwitchCase: 1,
          ignoredNodes: ["ConditionalExpression"],
        }],
        "@stylistic/key-spacing": "error",
        "@stylistic/keyword-spacing": "error",
        "@stylistic/linebreak-style": "error",
        "@stylistic/max-len": ["error", {
          code: 80,
          tabWidth: 2,
          ignoreUrls: true,
          ignorePattern: "goog.(module|require)",
        }],
        "@stylistic/new-parens": "error",
        "@stylistic/no-mixed-spaces-and-tabs": "error",
        "@stylistic/no-multi-spaces": "error",
        "@stylistic/no-multiple-empty-lines": ["error", {max: 2}],
        "@stylistic/no-tabs": "error",
        "@stylistic/no-trailing-spaces": "error",
        "@stylistic/object-curly-spacing": "error",
        "@stylistic/one-var-declaration-per-line": "error",
        "@stylistic/operator-linebreak": ["error", "after"],
        "@stylistic/padded-blocks": ["error", "never"],
        "@stylistic/quote-props": ["error", "consistent"],
        "@stylistic/quotes": ["error", "double"],
        "@stylistic/rest-spread-spacing": "error",
        "@stylistic/semi": "error",
        "@stylistic/semi-spacing": "error",
        "@stylistic/space-before-blocks": "error",
        "@stylistic/space-before-function-paren": ["error", {
          asyncArrow: "always",
          anonymous: "never",
          named: "never",
        }],
        "@stylistic/spaced-comment": ["error", "always"],
        "@stylistic/switch-colon-spacing": "error",
        "@stylistic/generator-star-spacing": ["error", "after"],
        "@stylistic/yield-star-spacing": ["error", "after"],
        // Core rules from eslint-config-google that still exist.
        "camelcase": ["error", {properties: "never"}],
        "curly": ["error", "multi-line"],
        "guard-for-in": "error",
        "new-cap": "error",
        "no-array-constructor": "error",
        "no-caller": "error",
        "no-extend-native": "error",
        "no-extra-bind": "error",
        "no-invalid-this": "error",
        "no-multi-str": "error",
        "no-new-wrappers": "error",
        "no-throw-literal": "error",
        "no-with": "error",
        "no-var": "error",
        "one-var": ["error", {var: "never", let: "never", const: "never"}],
        "prefer-const": ["error", {destructuring: "all"}],
        "prefer-promise-reject-errors": "error",
        "prefer-rest-params": "error",
        "prefer-spread": "error",
      },
    },
);

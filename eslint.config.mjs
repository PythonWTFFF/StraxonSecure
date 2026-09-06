/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    // Root level fallback: Ignore all root files so ESLint focuses on the subprojects
    ignores: [
      "**/*",
      "!straxonsecure/**",
      "!straxondigital/**",
    ],
  },
];

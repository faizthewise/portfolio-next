module.exports = {
  root: true,
  plugins: ["prettier"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "next",
    "next/core-web-vitals",
  ],
  rules: {
    "prettier/prettier": [
      "error",
      {
        endOfLine: "auto",
      },
    ],
  },
};

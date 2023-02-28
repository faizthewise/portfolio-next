module.exports = {
  extends: ["stylelint-config-standard", "stylelint-config-prettier"],
  rules: {
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: ["extends", "tailwind", "apply", "layer"],
      },
    ],
    "selector-pseudo-class-no-unknown": [
      true,
      {
        ignorePseudoClasses: ["global", "export"],
      },
    ],
    "property-no-unknown": [true, { ignoreSelectors: [":export"] }],
    "rule-empty-line-before": ["never", { ignore: ["after-comment"] }],
    "selector-class-pattern": [
      "^.[a-z]([a-zA-Z0-9]+)?((_([a-zA-Z0-9]+-?)+){0,2})?((__([a-zA-Z0-9]+-?)+){0,1})((_([a-zA-Z0-9]+-?)+){0,2})?$",
      { resolveNestedSelectors: true },
    ],
  },
};

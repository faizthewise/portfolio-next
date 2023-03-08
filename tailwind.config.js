const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ["Inter var", ...defaultTheme.fontFamily.sans],
      mono: ["'Major\\ Mono \\ Display'", defaultTheme.fontFamily.mono],
    },
    extend: {
      fontFamily: {
        display: ["Inter var", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: "#EB6440",
        secondary: "#497174",
        tertiary: "#D6E4E5",
        background: "#EFF5F5",
      },
    },
  },
  plugins: [],
};

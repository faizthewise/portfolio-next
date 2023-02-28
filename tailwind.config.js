const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx}",
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
  plugins: [
    require("@tailwindcss/forms"),
    // require("tailwindcss-animatecss")({
    //   settings: {
    //     animateSpeed: 250,
    //   },
    //   classes: [
    //     "animate__animated",
    //     "animate__infinite",
    //     "animate__fast",
    //     "animate__faster",
    //     "animate__slow",
    //     "animate__slower",
    //     "animate__fadeIn",
    //     "animate__fadeOut",
    //     "animate__fadeInUp",
    //     "animate__fadeInLeft",
    //     "animate__fadeInRight",
    //     "animate__fadeInDown",
    //     "animate__fadeOutUp",
    //     "animate__fadeOutDown",
    //     "animate__fadeOutLeft",
    //     "animate__fadeOutRight",
    //     "animate__flipInX",
    //     "animate__flipOutX",
    //     "animate__flipInY",
    //     "animate__flipOutY",
    //   ],
    // }),
  ],
};

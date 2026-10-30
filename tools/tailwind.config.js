// Theme of index.html. Build: bash tools/build_page.sh
module.exports = {
  content: ["./index.html"],
  theme: {
    extend: {
      colors: {
        sky:    { DEFAULT: "#3DB8F5", dark: "#1E8FD0", light: "#DDF3FF" },
        coral:  { DEFAULT: "#FF6F91", light: "#FFE3EA" },
        leaf:   { DEFAULT: "#5CC85A", light: "#E2F7E1" },
        sun:    { DEFAULT: "#FFC83D", light: "#FFF4D6" },
        violet: { DEFAULT: "#8E6CF0", light: "#EEE8FF" },
        tangerine: "#F6A23A",
        berry:  "#FF5A5F",
        ink:    "#16395A",
        cream:  "#FFF9EE",
      },
      fontFamily: { display: ['"Baloo 2"', "ui-rounded", "system-ui", "sans-serif"] },
      boxShadow: { pop: "0 6px 0 rgba(22,57,90,.12)", "pop-lg": "0 10px 0 rgba(22,57,90,.12)" },
    },
  },
};

/** Tokens do ReUse!: cores vêm de variáveis CSS (app/globals.css) para suportar tema claro e escuro. */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: token("canvas"),
        surface: token("surface"),
        soft: token("soft"),
        ink: token("ink"),
        muted: token("muted"),
        line: token("line"),
        field: token("field"),
        brand: {
          DEFAULT: token("brand"),
          strong: token("brand-strong"),
          soft: token("brand-soft"),
          text: token("brand-text"),
          on: token("on-brand"),
        },
        lime: { DEFAULT: token("lime"), soft: token("lime-soft") },
        night: token("night"),
        warn: { DEFAULT: token("warn"), soft: token("warn-soft") },
        danger: { DEFAULT: token("danger"), soft: token("danger-soft") },
        // Aliases usados pelos componentes da fase anterior.
        "reuse-green": token("brand"),
        "reuse-greenDark": token("brand-strong"),
        "reuse-greenLight": token("brand-soft"),
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      maxWidth: { page: "72rem" },
      letterSpacing: { tightest: "-0.035em" },
    },
  },
  plugins: [],
};

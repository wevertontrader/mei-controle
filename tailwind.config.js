/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#0f1419',
          hover: '#1a2332',
          active: '#1e3a5f',
          border: '#1e293b',
        },
        card: {
          bg: '#151c24',
          border: '#1e293b',
        },
      },
    },
  },
  plugins: [],
}

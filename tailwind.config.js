/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background-primary': '#121212',
        'background-secondary': '#1E1E2F',
        'accent-primary': '#E50914',
        'accent-hover': '#F40D17',
        'text-primary': '#FFFFFF',
        'text-secondary': '#B3B3B3',
      },
      fontFamily: {
        'primary': ['Montserrat', 'sans-serif'],
        'secondary': ['Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 8px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 16px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
} 
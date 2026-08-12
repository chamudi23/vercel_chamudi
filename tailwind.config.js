/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          main: '#1E222D',
          card: '#252A36',
          border: '#374151',
        },
        brand: {
          blue: '#3B82F6',
          green: '#10B981',
          red: '#EF4444',
        },
        text: {
          primary: '#F3F4F6',
          secondary: '#9CA3AF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
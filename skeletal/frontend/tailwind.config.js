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
          main: '#1E222D',      // Main background
          card: '#252A36',      // Cards and Sidebar
          border: '#374151',    // Subtle borders
        },
        brand: {
          blue: '#3B82F6',      // Vivid Blue
          green: '#10B981',     // Emerald Green
          red: '#EF4444',       // Warning/Back/Delete
        },
        text: {
          primary: '#F3F4F6',   // Off-White
          secondary: '#9CA3AF', // Cool Gray
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

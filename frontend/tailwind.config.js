/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cc-pink': '#ec4899',
        'cc-blue': '#3b82f6',
        'cc-dark': '#0f0f23',
        'cc-gray': '#1f1f3a',
      },
      backgroundImage: {
        'cc-gradient': 'linear-gradient(135deg, #ec4899 0%, #3b82f6 100%)',
        'cc-dark-gradient': 'linear-gradient(135deg, #0f0f23 0%, #1f1f3a 100%)',
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backdropBlur: {
        '10': '10px',
      },
    },
  },
  plugins: [],
}
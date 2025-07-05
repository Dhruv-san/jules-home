/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  // For Tailwind v2 compatibility, add purge as well
  purge: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Mona Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        'brand-main': '#f43f5e',
        'brand-dark': '#be185d',
        'brand-accent': '#f59e42',
        'background-light': '#f8fafc',
        'background-dark': '#f1f5f9',
      },
      boxShadow: {
        'glow': '0 4px 32px 0 rgba(244,63,94,0.15)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        'cta-gradient': 'linear-gradient(90deg, #f43f5e 0%, #f59e42 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-in',
        'slide-up': 'slideUp 0.7s cubic-bezier(.4,0,.2,1)',
        'bounce': 'bounce 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(40px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}

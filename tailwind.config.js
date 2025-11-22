/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': 'rgb(var(--brand-primary) / <alpha-value>)',
        'brand-secondary': 'rgb(var(--brand-secondary) / <alpha-value>)',
        'brand-background': 'rgb(var(--brand-background) / <alpha-value>)',
        'brand-surface': 'rgb(var(--brand-surface) / <alpha-value>)',
        'brand-border': 'rgb(var(--brand-border) / <alpha-value>)',
        'brand-text-primary': 'rgb(var(--brand-text-primary) / <alpha-value>)',
        'brand-text-secondary': 'rgb(var(--brand-text-secondary) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-fast': 'fadeIn 0.2s ease-in-out',
        'slide-in-bottom-right': 'slideInBottomRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideInBottomRight: {
            '0%': { transform: 'translate(20px, 20px)', opacity: 0 },
            '100%': { transform: 'translate(0, 0)', opacity: 1 },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

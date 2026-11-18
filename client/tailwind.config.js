/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#151312',
        coal: '#211B19',
        neumo: '#292321',
        card: '#292321',
        elevated: '#302925',
        line: '#423630',
        yellow: '#FFC247',
        'yellow-soft': '#FFD46A',
        orange: '#FF6B00',
        'orange-hover': '#E85D00',
        red: '#FF6B00',
        cream: '#FFF1E5',
        peach: '#E6B8A2',
        muted: '#C7BDB5',
        smoke: '#9C9189',
      },
      fontFamily: {
        display: ['Anton', 'Impact', 'Haettenschweiler', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      boxShadow: {
        'neumo-raised': '8px 8px 16px #1b1715, -8px -8px 16px #352d2a',
        'neumo-raised-sm': '5px 5px 10px #1b1715, -5px -5px 10px #352d2a',
        'neumo-inset': 'inset 5px 5px 10px #1b1715, inset -5px -5px 10px #352d2a',
        'neumo-inset-sm': 'inset 3px 3px 6px #1b1715, inset -3px -3px 6px #352d2a',
        'neumo-flat': '4px 4px 8px #1b1715, -4px -4px 8px #352d2a',
        glow: '0 0 0 1px rgba(255,194,71,.2), 0 14px 34px -18px rgba(255,194,71,.28)',
        'glow-orange': '0 0 0 1px rgba(255,107,0,.24), 0 14px 34px -18px rgba(255,107,0,.32)',
        card: '8px 8px 16px #1b1715, -8px -8px 16px #352d2a',
        soft: '0 18px 40px -28px rgba(21,19,18,.55)',
      },
      backgroundImage: {
        'hero-glow':
          'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,107,0,.14), rgba(227,38,25,.06) 35%, transparent 62%), radial-gradient(ellipse 45% 35% at 90% 10%, rgba(255,194,71,.1), transparent 55%), radial-gradient(ellipse 50% 35% at 10% 20%, rgba(139,0,0,.08), transparent 55%)',
        'card-sheen': 'linear-gradient(180deg, rgba(255,241,229,.04) 0%, rgba(255,241,229,0) 50%)',
        grid: 'linear-gradient(rgba(255,241,229,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,241,229,0.03) 1px, transparent 1px)',
        noise:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        marquee: 'marquee 28s linear infinite',
        shimmer: 'shimmer 2.2s linear infinite',
      },
      transitionTimingFunction: {
        crunch: 'cubic-bezier(.22,1,.36,1)',
      },
    },
  },
  plugins: [],
};

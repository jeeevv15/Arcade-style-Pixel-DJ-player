/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}','./components/**/*.{js,jsx}','./app/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dj: {
          purple:  '#2d0a6e',
          violet:  '#5a1090',
          magenta: '#c0328a',
          pink:    '#ff6ed8',
          orange:  '#f07540',
          peach:   '#f8c060',
          cream:   '#fdf0c0',
          cloud:   '#d8eaf8',
        },
        neon: {
          pink:    '#ff6ed8',
          orange:  '#ffaa44',
          purple:  '#c060ff',
          yellow:  '#ffe060',
          green:   '#60ffaa',
          red:     '#ff4466',
          cyan:    '#60d8ff',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        mono:  ['"Share Tech Mono"', 'monospace'],
      },
      boxShadow: {
        'neon-pink':   '0 0 8px #ff6ed8, 0 0 20px #ff6ed844',
        'neon-orange': '0 0 8px #ffaa44, 0 0 20px #ffaa4444',
        'neon-purple': '0 0 8px #c060ff, 0 0 20px #c060ff44',
        'neon-yellow': '0 0 8px #ffe060, 0 0 20px #ffe06044',
        'neon-green':  '0 0 8px #60ffaa, 0 0 20px #60ffaa44',
      },
      animation: {
        'spin-slow':      'spin 3s linear infinite',
        'float':          'float 3s ease-in-out infinite',
        'header-glow':    'headerGlow 2.5s ease-in-out infinite',
        'blink':          'blink 1s step-end infinite',
        'pulse-neon':     'pulseNeon 1.5s ease-in-out infinite',
        'slide-up':       'slideUp 0.25s ease-out',
        'panel-pulse':    'panelPulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: 'rgb(var(--color-void) / <alpha-value>)',
        voidDeep: 'rgb(var(--color-void-deep) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        violet: { 
          DEFAULT: 'rgb(var(--color-violet) / <alpha-value>)', 
          dim: 'rgb(var(--color-violet-dim) / <alpha-value>)', 
          bright: 'rgb(var(--color-violet-bright) / <alpha-value>)' 
        },
        cyan: { 
          DEFAULT: 'rgb(var(--color-cyan) / <alpha-value>)', 
          dim: 'rgb(var(--color-cyan-dim) / <alpha-value>)' 
        },
        magenta: 'rgb(var(--color-magenta) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        mute: 'rgb(var(--color-mute) / <alpha-value>)',
        line: 'var(--color-line)'
      },
      fontFamily: {
        display: ['"Clash Display"', 'sans-serif'],
        body: ['"General Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      backgroundImage: {
        'signal-grid': 'radial-gradient(circle at 20% 0%, rgba(124,92,255,0.18), transparent 45%), radial-gradient(circle at 90% 30%, rgba(0,240,216,0.12), transparent 40%)',
      },
      keyframes: {
        pulseLine: {
          '0%,100%': { strokeDashoffset: '0' },
          '50%': { strokeDashoffset: '-40' }
        },
        floatY: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        glow: {
          '0%,100%': { opacity: 0.55 },
          '50%': { opacity: 1 }
        }
      },
      animation: {
        pulseLine: 'pulseLine 2.4s linear infinite',
        floatY: 'floatY 5s ease-in-out infinite',
        glow: 'glow 3s ease-in-out infinite'
      }
    }
  },
  plugins: []
}

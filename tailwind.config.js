export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        navy: '#17243A', midnight: '#223653', slate2: '#526781', bg: '#F6F8FB', line: '#E6EAF0', muted: '#8B95A5',
        ok: '#23865B', warn: '#D99A36', bad: '#D95757', info: '#477DC4', na: '#8A94A6',
      },
      boxShadow: { card: '0 1px 2px rgba(23,36,58,.04), 0 1px 1px rgba(23,36,58,.03)' },
    },
  },
}

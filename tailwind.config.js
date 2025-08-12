
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html','./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Pretendard Variable', 'system-ui', 'apple sd gothic neo', 'sans-serif'] },
      colors: { brand: { DEFAULT: '#4F46E5', soft: '#6366F1' } },
      borderRadius: { '2xl': '1rem' }
    },
  },
  plugins: [],
}

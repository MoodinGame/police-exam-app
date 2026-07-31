/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // สีหลัก
        navy: { DEFAULT: '#2B2D42' },
        graylight: { DEFAULT: '#8D99AE' },
        // สีรอง
        graydark: { DEFAULT: '#333333' },
        // สีเน้น
        accent: {
          cyan: '#00B4D8',
          green: '#4ADE80',
        },
      },
      fontFamily: {
        prompt: ['var(--font-prompt)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

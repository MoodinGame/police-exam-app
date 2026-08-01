/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    // lib/ เก็บคลาสสีไว้เป็นสตริง (เช่น subjectStyles.js, calendarEvents.js)
    // ถ้าไม่สแกนที่นี่ Tailwind จะไม่สร้างคลาสเหล่านั้น ทำให้พื้นหลังการ์ดหายไป
    './lib/**/*.{js,jsx}',
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
          gold: '#D8B06B',
        },
      },
      fontFamily: {
        prompt: ['var(--font-prompt)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

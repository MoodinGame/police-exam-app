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
      maxWidth: {
        // ความกว้างมาตรฐานของ container ระดับหน้า — แก้ที่เดียวปรับได้ทั้งระบบ
        // (เดิมปนกันระหว่าง max-w-5xl 1024px / 6xl 1152px / 7xl 1280px)
        app: '1280px',
      },
      colors: {
        // สีประจำวิชา — เลือกให้ "จำได้" คือแยกเฉดห่างกันชัดบนวงล้อสี
        // แต่คุมความเข้ม/ความอิ่มตัวให้อยู่ระดับเดียวกัน จะได้ดูเป็นชุดเดียวกันทั้งระบบ
        // ทุกสีผ่านคอนทราสต์กับตัวอักษรสีขาวอย่างน้อย 4.5:1 (WCAG AA)
        // ไล่เฉดห่างกันราว 50° รอบวงล้อสี เพื่อให้แยกวิชาออกจากกันได้ด้วยสีอย่างเดียว
        subject: {
          thai: '#B3123C',           // ภาษาไทย        — แดงชาด        (~345°)
          social: '#B45309',         // สังคม           — ส้มอิฐ         (~25°)
          correspondence: '#4D7C0F', // สารบรรณ        — เขียวมะกอก    (~88°)
          aptitude: '#0F766E',       // ความสามารถทั่วไป — เขียวหัวเป็ด   (~168°)
          it: '#0369A1',             // คอมพิวเตอร์      — ฟ้าน้ำเงิน     (~205°)
          law: '#3F3D9E',            // กฎหมาย          — ม่วงคราม      (~245°)
          english: '#A21CAF',        // ภาษาอังกฤษ      — ม่วงบานเย็น    (~292°)
          police: '#3F4C63',         // สารบรรณตำรวจ    — เทาน้ำเงิน
        },
        // ชื่อโทเคนคงเดิมทั้งหมด เปลี่ยนเฉพาะค่าสี ทำให้ทุกหน้าที่ใช้ navy/graydark/accent-*
        // เปลี่ยนธีมพร้อมกัน โดยไม่ต้องไล่แก้ไฟล์รายหน้า
        navy: { DEFAULT: '#17345B' },       // heading — น้ำเงินอมเทา อ่านสบายกว่าเดิม
        graylight: { DEFAULT: '#94A6BC' },  // ข้อความรอง / เส้นขอบ
        graydark: { DEFAULT: '#62748A' },   // body text
        accent: {
          cyan: '#4F86F7',  // primary   — soft blue
          green: '#35B98B', // success   — mint
          gold: '#F5C76A',  // accent    — warm cream
          teal: '#67C6B3',  // secondary
        },
        surface: { DEFAULT: '#FFFFFF', soft: '#F7FAFC' },
        line: { DEFAULT: '#E4ECF4' },
        danger: { DEFAULT: '#EF6A6A' },
      },
      fontFamily: {
        prompt: ['var(--font-prompt)', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 14px rgba(30, 64, 100, 0.06)',
        card: '0 8px 30px rgba(30, 64, 100, 0.09)',
      },
    },
  },
  plugins: [],
};

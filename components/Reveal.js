'use client';

import { useEffect, useRef, useState } from 'react';

// ทำให้เนื้อหาค่อย ๆ เลื่อนขึ้น+จางเข้ามาตอนเลื่อนจอมาถึง ใช้ CSS transition ล้วน
// ไม่ผูกกับ animationend เลยไม่มีปัญหาเดียวกับที่ SweetAlert2 เจอตอน reduced-motion บังคับ duration เกือบ 0
export default function Reveal({ children, className = '', delay = 0, as: Tag = 'div' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: '150px 0px 150px 0px' },
    );
    observer.observe(node);
    // กันเนื้อหาค้างจางหายถาวร ถ้าเบราว์เซอร์กระโดดข้ามจุดนี้ไปโดยไม่เคยเรนเดอร์เฟรมที่มองเห็น
    // (เช่น กด End, ลิงก์ #hash, หรือ scrollTo แบบทันที) IntersectionObserver จะไม่ยิงเลย
    const fallback = setTimeout(() => setVisible(true), 2500);
    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

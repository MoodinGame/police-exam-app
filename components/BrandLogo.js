/**
 * โลโก้กลางของ POLREADY — ใช้ที่เดียวทั้งเว็บ (หน้าแรก, login, sidebar ผู้เรียน, แอดมิน)
 *
 * เดิมทั้ง 4 จุดใช้ไอคอน ShieldCheck สำเร็จรูปจาก lucide แล้วใส่สีคนละแบบ
 * จึงไม่ใช่โลโก้จริงและจำไม่ได้ ตัวนี้เป็นรูปวาดเฉพาะของแบรนด์:
 * โล่ (ตำรวจ) + แท่งไต่ระดับข้างใน (ความคืบหน้าจากการฝึก) = "พร้อมสอบ"
 *
 * รับสีผ่าน currentColor เพื่อให้วางบนพื้นเข้มหรือพื้นสว่างก็ได้
 * ส่วนแท่งข้างในคุมแยกด้วย accent เพื่อคงสีทองประจำแบรนด์ไว้เสมอ
 */
export function BrandMark({ size = 40, accent = '#d3a950', className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="POLREADY"
      className={className}
    >
      {/* โล่ */}
      <path
        d="M20 3.2 L33.4 8.6 V18.4 C33.4 26.7 27.9 33.6 20 36.4 C12.1 33.6 6.6 26.7 6.6 18.4 V8.6 Z"
        fill="currentColor"
      />
      {/* ขอบในบางๆ ให้โล่ดูมีมิติตอนย่อเล็ก */}
      <path
        d="M20 6.6 L30.2 10.7 V18.6 C30.2 25.1 26 30.6 20 33.0 C14 30.6 9.8 25.1 9.8 18.6 V10.7 Z"
        stroke={accent}
        strokeOpacity="0.32"
        strokeWidth="1.1"
      />
      {/* แท่งไต่ระดับ = ความคืบหน้า */}
      <rect x="13.6" y="21.4" width="3.5" height="6.2" rx="1.75" fill={accent} />
      <rect x="18.25" y="17.6" width="3.5" height="10" rx="1.75" fill={accent} />
      <rect x="22.9" y="13.4" width="3.5" height="14.2" rx="1.75" fill={accent} />
    </svg>
  );
}

/**
 * โลโก้เต็ม = เครื่องหมาย + ชื่อแบรนด์
 * @param {'dark'|'light'} tone  dark = วางบนพื้นเข้ม, light = วางบนพื้นสว่าง
 */
export function BrandLogo({ tone = 'light', size = 40, showTagline = true, className = '' }) {
  const onDark = tone === 'dark';
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <BrandMark size={size} className={onDark ? 'text-white' : 'text-[#1c2b5a]'} />
      <span className="leading-none">
        <span className={`block text-lg font-bold tracking-[0.08em] ${onDark ? 'text-white' : 'text-[#1c2b5a]'}`}>
          POL<span className="text-[#d3a950]">READY</span>
        </span>
        {showTagline && (
          <span className={`mt-1 block text-[10px] tracking-[0.14em] ${onDark ? 'text-white/55' : 'text-graydark/55'}`}>
            เตรียมสอบตำรวจ
          </span>
        )}
      </span>
    </span>
  );
}

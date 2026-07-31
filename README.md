# เว็บทำข้อสอบเตรียมสอบตำรวจ (Prototype — Phase 1)

Next.js 14 (App Router) + Tailwind CSS ตามดีไซน์และโครงสร้างที่ตกลงกันไว้ในแชท

## วิธีติดตั้งและรัน

```bash
npm install
npm run dev
```

เปิด http://localhost:3000

## Design tokens ที่ใช้

- สีหลัก: น้ำเงินเข้ม `#2B2D42` (navy), เทาอ่อน `#8D99AE` (graylight)
- สีรอง: ขาว `#FFFFFF`, เทาเข้ม `#333333` (graydark)
- สีเน้น: ฟ้าสด `#00B4D8` (accent-cyan), เขียวนีออน `#4ADE80` (accent-green)
- ฟอนต์: Prompt (โหลดผ่าน `next/font/google`)

แก้ไข/เพิ่มสีหรือฟอนต์ได้ที่ `tailwind.config.js` และ `app/layout.js`

## สิ่งที่ใช้งานได้แล้วใน Phase 1

- หน้าแรก เลือกสายสอบ (`/`)
- Login เบอร์มือถือ + OTP จำลอง (`/login` — รหัส demo คือ `123456`)
- แดชบอร์ด: นับถอยหลังวันสอบ (อิงวันที่ 29 พ.ย. 2569 ของจริง), การ์ดสถิติเบื้องต้น
- แบบฝึกหัดรายวิชา: 6 วิชาของสายอำนวยการ 2569 พร้อมสัดส่วนข้อสอบจริง (`/practice`)
- หน้าทำข้อสอบเต็มรูปแบบ: จับเวลาถอยหลัง, เลื่อนข้อ, progress bar (`/exam/[subject]`)
- หน้าเฉลย + คำอธิบายรายข้อ + สรุปคะแนนท้ายชุด

## สิ่งที่ยังเป็น placeholder (รอ Phase ถัดไป)

- Mock Exam เต็มรูปแบบ, แฟลชการ์ด, ปฏิทิน, อันดับ, ประกาศ — เป็นหน้า "เร็วๆ นี้"
- ระบบสมาชิกรายปี + อัปโหลดสลิปโอนเงิน + Admin panel ตรวจสลิป — ยังไม่ได้สร้าง
- OTP เป็นการจำลองด้วยรหัสคงที่ ยังไม่เชื่อม SMS gateway จริง (ต้องมี backend + provider เช่น Twilio/THSMS)
- **คำถามในคลังข้อสอบเป็นตัวอย่างสำหรับสาธิตระบบเท่านั้น** ยังไม่ใช่ข้อสอบจริงที่ผ่านการตรวจทาน — ดูหมายเหตุใน `lib/questions.js`
- ข้อมูลยังไม่ persist ข้ามการรีเฟรช/ผู้ใช้ (ยังไม่ต่อฐานข้อมูล) — คะแนน/ประวัติจะหายเมื่อโหลดหน้าใหม่

## โครงสร้างโปรเจกต์

```
app/
  layout.js              root layout + ฟอนต์ Prompt
  page.js                หน้าแรก เลือกสายสอบ (public)
  login/page.js           login เบอร์มือถือ + OTP
  (main)/layout.js        sidebar shell สำหรับหน้าที่ล็อกอินแล้ว
  (main)/dashboard/       แดชบอร์ด
  (main)/practice/        เลือกวิชาฝึกทำ
  (main)/mock-exam/       stub
  (main)/flashcards/      stub
  (main)/calendar/        stub
  (main)/leaderboard/     stub
  (main)/announcements/   stub
  (main)/account/         stub
  exam/[subject]/page.js  หน้าทำข้อสอบ + เฉลย + สรุปคะแนน (เต็มจอ ไม่มี sidebar)
components/
  Sidebar.js
lib/
  subjects.js             ข้อมูลวิชา + สัดส่วนข้อสอบสายอำนวยการ 2569
  questions.js             คลังคำถามตัวอย่าง
```

## ขั้นต่อไปที่แนะนำ

1. แทนที่ `lib/questions.js` ด้วยคลังข้อสอบจริงที่ผ่านการตรวจทาน (แนะนำแยกเป็นไฟล์ JSON หรือย้ายไปฐานข้อมูลเมื่อมีจำนวนมาก)
2. ต่อฐานข้อมูลจริง (เช่น PostgreSQL/Supabase) เพื่อเก็บ User, Attempt, Membership
3. เชื่อม SMS gateway จริงสำหรับ OTP
4. สร้าง Mock Exam, Admin panel ตรวจสลิป ตามโครงสร้างที่คุยกันไว้ในแชท

งานต่อจากนี้ (ต่อ backend จริง, deploy, ทดสอบ) เหมาะกับการทำต่อใน Claude Code ซึ่งรันโปรเจกต์และติดตั้ง dependency ได้จริงในเครื่อง

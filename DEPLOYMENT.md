# Production deployment

โปรเจกต์นี้เป็น Next.js และสามารถ Deploy บน Vercel ได้โดยไม่ต้องมี `vercel.json` เพิ่มเติม

## 1. เตรียมฐานข้อมูล

สำหรับฐานข้อมูลใหม่ ให้รัน [supabase/schema.sql](supabase/schema.sql) ก่อนหนึ่งครั้ง แล้วจึงรัน migration ทุกไฟล์ใน `supabase/migrations/` ตามลำดับชื่อไฟล์ ผ่าน Supabase CLI หรือ SQL Editor ของโปรเจกต์ Supabase เป้าหมาย โดยเฉพาะ migration สำหรับโปรไฟล์, คลังความรู้ และ bookmarks

`schema.sql` สร้างตาราง `payment_slips` และ Storage bucket ชื่อ `payment-slips`; migrations สร้าง `membership_plans` และ `line_notification_subscribers` เพิ่มเติม หากใช้ฐานข้อมูลใหม่ห้ามข้ามขั้นตอนนี้ เพราะระบบชำระเงินจะไม่ใช้แพ็กเกจ hardcode แทนฐานข้อมูลอีกต่อไป

ตรวจสอบด้วยว่ามี Row Level Security และ Storage policy ที่เหมาะสมกับ production แล้ว

## 2. ตั้งค่า Environment Variables ใน Vercel

เพิ่มตัวแปรตาม [.env.example](.env.example) ใน Vercel Project Settings > Environment Variables โดยกำหนดอย่างน้อยใน Production:

| Variable | ใช้สำหรับ | ข้อควรระวัง |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL ของ Supabase project | เป็นค่าที่ส่งให้ browser ได้ |
| `SUPABASE_SECRET_KEY` | งาน server-side กับ Supabase | ห้ามขึ้นต้นด้วย `NEXT_PUBLIC_` |
| `THSMS_API_TOKEN` | ส่ง OTP ทาง SMS | เก็บเป็น secret เท่านั้น |
| `THSMS_SENDER` | Sender ของ SMS | ต้องได้รับอนุมัติจากผู้ให้บริการ |
| `OTP_HMAC_SECRET` | ลงลายมือชื่อข้อมูล OTP | สุ่มอย่างน้อย 32 ตัวอักษรและไม่ใช้ซ้ำ |
| `LINE_CHANNEL_ACCESS_TOKEN` | ส่งแจ้งเตือนสลิปผ่าน LINE | server-side only |
| `LINE_CHANNEL_SECRET` | ตรวจลายเซ็น LINE webhook | server-side only |
| `LINE_ADMIN_SETUP_TOKEN` | ยืนยันการสมัครรับแจ้งเตือนของแอดมิน | สุ่มค่าใหม่ที่เดายาก |
| `APP_URL` | ลิงก์จากข้อความ LINE กลับสู่หน้าตรวจสลิป | ต้องเป็น URL จริงแบบ HTTPS ไม่มี `/` ท้ายสุด |

สำหรับ Preview ควรใช้ Supabase/THSMS ที่แยกจาก production หรือเปิด Vercel Deployment Protection เพื่อไม่ให้ทดลองส่ง OTP ถึงผู้ใช้จริง

`OTP_DEV_MODE` ใช้ได้เฉพาะ local development เท่านั้น และไม่ควรตั้งเป็น `true` ใน Vercel

`LINE_ADMIN_USER_IDS` ใช้ได้เฉพาะ local test เท่านั้น ให้เว้นว่างใน Production แล้วให้แอดมินสมัครรับแจ้งเตือนผ่าน LINE webhook ที่ยืนยันลายเซ็นแล้ว

## 3. สร้าง Project บน Vercel

1. Push source code (โดยไม่รวม `.env.local`) ไปยัง Git provider
2. Import repository ใน Vercel แล้วเลือก Framework Preset เป็น **Next.js**
3. ใช้ Install Command: `npm ci`
4. ใช้ Build Command: `npm run build` (ระบบจะรัน `npm run predeploy:check` ก่อน build โดยอัตโนมัติ)
5. ตั้ง Node.js เป็น 20 ขึ้นไป และเพิ่ม environment variables จากข้อ 2
6. Deploy แล้วผูก custom domain ตามต้องการ

## 4. ตรวจสอบก่อนเปิดใช้งานจริง

รันในเครื่องหรือ CI:

```bash
npm ci
npm run predeploy:check
npm run typecheck
npm run build
npm audit --omit=dev
```

เมื่อรันใน Production preflight จะหยุด build หาก Supabase, OTP, LINE หรือ `APP_URL` ยังว่าง, ใช้ placeholder, ใช้ `localhost`, เปิด `OTP_DEV_MODE` หรือใส่ `LINE_ADMIN_USER_IDS` ไว้

หลัง Deploy ให้ทดสอบอย่างน้อย:

- หน้า `/`, `/dashboard`, `/knowledge` และ `/profile` บน desktop และ mobile
- สมัคร/เข้าสู่ระบบด้วย OTP จริงหนึ่งครั้ง
- การค้นหาและ Bookmark ในคลังความรู้
- สิทธิ์ admin, การแก้ไขคลังความรู้ และการแสดงผลข้อมูลจาก Supabase
- ส่งสลิปจริงหนึ่งครั้ง: ต้องสร้างรายการ `pending`, LINE ต้องแจ้งมือถือแอดมิน และการอนุมัติต้องเปิดสิทธิ์แพ็กเกจที่ตั้งไว้ในฐานข้อมูล
- ข้อความผิดพลาดและ Network logs ใน Vercel

## การย้อนกลับ

หากพบปัญหาหลังปล่อยระบบ ให้เลือก Deployment ก่อนหน้าที่ผ่านการตรวจสอบใน Vercel แล้วเลือก **Promote to Production**. อย่าแก้ environment secret ผ่าน source code หรือ commit ลง repository

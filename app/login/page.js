import { Suspense } from 'react';
import AuthCard from '@/components/AuthCard';

// AuthCard อ่าน query string (?reason=other-device) จึงต้องอยู่ใน Suspense
// ไม่งั้น Next จะ bail out จาก static rendering ทั้งหน้า
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthCard mode="login" />
    </Suspense>
  );
}

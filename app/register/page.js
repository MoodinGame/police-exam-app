import { Suspense } from 'react';
import AuthCard from '@/components/AuthCard';

// AuthCard ใช้ useSearchParams ร่วมกันทั้งสองโหมด จึงต้องมี Suspense เหมือนหน้า login
export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <AuthCard mode="register" />
    </Suspense>
  );
}

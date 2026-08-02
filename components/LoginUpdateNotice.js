'use client';

import { useEffect, useRef } from 'react';
import { showLoginUpdateNotice } from '@/lib/sweetAlert';
import { useMembershipStatus } from '@/lib/useMembershipStatus';

// เปลี่ยนเวอร์ชันนี้เมื่อต้องการให้ผู้ใช้ทุกคนเห็นประกาศรอบใหม่อีกครั้ง
const NOTICE_VERSION = '2026-08-01';
const storageKey = `polready-login-update:${NOTICE_VERSION}`;

export default function LoginUpdateNotice() {
  const { loading, isLoggedIn } = useMembershipStatus();
  const scheduled = useRef(false);

  useEffect(() => {
    if (loading || !isLoggedIn || scheduled.current || typeof window === 'undefined') return undefined;

    scheduled.current = true;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/announcements', { cache: 'no-store' });
        const result = await response.json();
        const announcement = (response.ok ? result.announcements || [] : [])
          .find((item) => item.show_on_login && !window.localStorage.getItem(`polready-announcement:${item.id}:${item.updated_at || item.created_at}`));

        if (announcement) {
          await showLoginUpdateNotice(announcement);
          window.localStorage.setItem(`polready-announcement:${announcement.id}:${announcement.updated_at || announcement.created_at}`, new Date().toISOString());
        } else if (!window.localStorage.getItem(storageKey)) {
          await showLoginUpdateNotice();
          window.localStorage.setItem(storageKey, new Date().toISOString());
        }
      } catch {
        if (!window.localStorage.getItem(storageKey)) {
          await showLoginUpdateNotice();
          window.localStorage.setItem(storageKey, new Date().toISOString());
        }
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      scheduled.current = false;
    };
  }, [isLoggedIn, loading]);

  return null;
}

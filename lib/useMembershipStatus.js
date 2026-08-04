'use client';

import { useEffect, useState } from 'react';

const initialState = {
  loading: true,
  isLoggedIn: false,
  isMember: false,
  membership: null,
};

export function useMembershipStatus() {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch('/api/membership', { cache: 'no-store' });
        const result = await response.json();
        if (!active) return;

        if (!response.ok) {
          // ถูกล็อกอินทับจากอุปกรณ์อื่น — ต้องบอกเหตุผลและพากลับไปล็อกอินใหม่
          // ไม่งั้นหน้าจะกลายเป็นสภาพ "ยังไม่ล็อกอิน" เงียบ ๆ จนผู้ใช้งง
          if (result?.details?.code === 'SESSION_TAKEN_OVER') {
            window.location.replace('/login?reason=other-device');
            return;
          }
          // ผู้ดูแลระงับบัญชีระหว่างใช้งาน — พาไปหน้าล็อกอินพร้อมเหตุผล
          if (result?.details?.code === 'ACCOUNT_SUSPENDED') {
            window.location.replace('/login?reason=suspended');
            return;
          }
          setState({ ...initialState, loading: false });
          return;
        }

        setState({
          loading: false,
          isLoggedIn: true,
          isMember: Boolean(result.isMember),
          membership: result.membership,
        });
      } catch {
        if (active) setState({ ...initialState, loading: false });
      }
    }

    load();
    return () => { active = false; };
  }, []);

  return state;
}

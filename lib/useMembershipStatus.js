'use client';

import { useEffect, useState } from 'react';
import { hasActiveMembership } from '@/lib/entitlements';

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
          setState({ ...initialState, loading: false });
          return;
        }

        setState({
          loading: false,
          isLoggedIn: true,
          isMember: hasActiveMembership(result.membership),
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

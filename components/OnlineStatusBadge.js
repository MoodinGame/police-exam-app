'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'polready_client_id';
const HEARTBEAT_MS = 25000;

function getClientId() {
  if (typeof window === 'undefined') return null;
  let id = window.sessionStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.sessionStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export default function OnlineStatusBadge({ className = '' }) {
  const [online, setOnline] = useState(null);

  useEffect(() => {
    const clientId = getClientId();
    if (!clientId) return undefined;
    let cancelled = false;

    const sendHeartbeat = async () => {
      try {
        const response = await fetch('/api/online-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId }),
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled && typeof data.online === 'number') setOnline(data.online);
      } catch {
        // เช็คสถานะไม่ได้ก็แค่ไม่แสดงป้ายนี้ ไม่รบกวนผู้ใช้ด้วย error
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, HEARTBEAT_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (online === null) return null;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      {online} คนกำลังฝึกอยู่ตอนนี้
    </span>
  );
}

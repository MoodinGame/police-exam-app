'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle, Save, UserRound } from 'lucide-react';

const emptyProfile = { username: '', email: '', phone: '' };

export default function ProfileEditor() {
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const response = await fetch('/api/account', { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
        if (active) setProfile(result.profile);
      } catch (loadError) {
        if (active) setError(loadError.message || 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProfile();
    return () => { active = false; };
  }, []);

  const updateField = (field, value) => {
    setSaved(false);
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const response = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: profile.username, email: profile.email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ไม่สามารถบันทึกโปรไฟล์ได้');
      setProfile(result.profile);
      setSaved(true);
    } catch (saveError) {
      setError(saveError.message || 'ไม่สามารถบันทึกโปรไฟล์ได้');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="profile-editor" className="mt-6 rounded-2xl border border-graylight/25 bg-white p-5 sm:p-6" aria-labelledby="profile-editor-title">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-cyan/10 text-accent-cyan"><UserRound size={20} /></div>
        <div>
          <h2 id="profile-editor-title" className="font-semibold text-navy">แก้ไขโปรไฟล์</h2>
          <p className="mt-1 text-sm text-graydark/55">แก้ไขชื่อผู้ใช้และอีเมลสำหรับติดต่อได้ทุกเมื่อ</p>
        </div>
      </div>

      {loading ? <div className="mt-5 h-28 skeleton" /> : (
        <form onSubmit={saveProfile} className="mt-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-medium text-graydark">ชื่อผู้ใช้
              <input value={profile.username} onChange={(event) => updateField('username', event.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 15))} autoComplete="username" maxLength={15} className="mt-2 w-full rounded-xl border border-graylight/35 px-3.5 py-3 outline-none focus:border-accent-cyan" />
            </label>
            <label className="text-sm font-medium text-graydark">อีเมล
              <input type="email" value={profile.email} onChange={(event) => updateField('email', event.target.value)} autoComplete="email" className="mt-2 w-full rounded-xl border border-graylight/35 px-3.5 py-3 outline-none focus:border-accent-cyan" />
            </label>
            <label className="text-sm font-medium text-graydark">เบอร์โทรศัพท์สำหรับ OTP
              <input value={profile.phone} readOnly className="mt-2 w-full cursor-not-allowed rounded-xl border border-graylight/25 bg-graylight/10 px-3.5 py-3 text-graydark/60 outline-none" />
            </label>
          </div>
          <p className="mt-3 text-xs text-graydark/50">หากต้องการเปลี่ยนเบอร์โทรศัพท์ ต้องยืนยันตัวตนกับผู้ดูแลก่อน เพื่อปกป้องสิทธิ์สมาชิกของคุณ</p>
          {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}
          {saved && <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700"><CheckCircle2 size={17} />บันทึกข้อมูลโปรไฟล์แล้ว</p>}
          <button type="submit" disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-60">
            {saving ? <><LoaderCircle size={16} className="animate-spin" />กำลังบันทึก</> : <><Save size={16} />บันทึกโปรไฟล์</>}
          </button>
        </form>
      )}
    </section>
  );
}

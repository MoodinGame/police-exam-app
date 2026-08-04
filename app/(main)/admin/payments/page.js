'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CircleAlert, Clock3, FileImage, LoaderCircle, LogIn, QrCode, Save, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/membership';

const MAX_QR_SIZE = 2 * 1024 * 1024;

const FILTERS = [
  { id: 'pending', label: 'รอตรวจ' },
  { id: 'approved', label: 'อนุมัติแล้ว' },
  { id: 'rejected', label: 'ไม่อนุมัติ' },
  { id: 'all', label: 'ทั้งหมด' },
];

const emptyAccount = { bankName: '', accountName: '', accountNumber: '' };

export default function AdminPaymentsPage() {
  const [slips, setSlips] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [rejectingId, setRejectingId] = useState(null);
  const [note, setNote] = useState('');
  const [account, setAccount] = useState(emptyAccount);
  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [error, setError] = useState('');
  const [accessError, setAccessError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/payments', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) {
        setAccessError(result.error || 'ไม่สามารถเข้าถึงข้อมูลได้');
        return;
      }
      setSlips(result.slips || []);
      setAccount({ ...emptyAccount, ...(result.paymentAccount || {}) });
      setAccessError('');
    } catch (loadError) {
      setError(loadError.message || 'ไม่สามารถโหลดรายการสลิปได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const counts = useMemo(() => slips.reduce((total, slip) => ({ ...total, [slip.status]: (total[slip.status] || 0) + 1 }), { pending: 0, approved: 0, rejected: 0 }), [slips]);
  const visibleSlips = filter === 'all' ? slips : slips.filter((slip) => slip.status === filter);

  const review = async (id, action, rejectionNote = '') => {
    setReviewingId(id);
    setError('');
    try {
      const response = await fetch(`/api/admin/payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: rejectionNote }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ไม่สามารถบันทึกผลตรวจสอบได้');
      setRejectingId(null);
      setNote('');
      setNotice(action === 'approve' ? 'อนุมัติและเปิดสิทธิ์สมาชิกเรียบร้อยแล้ว' : 'บันทึกการไม่อนุมัติเรียบร้อยแล้ว');
      await refresh();
    } catch (reviewError) {
      setError(reviewError.message || 'ไม่สามารถบันทึกผลตรวจสอบได้');
    } finally {
      setReviewingId(null);
    }
  };

  const saveAccount = async (event) => {
    event.preventDefault();
    setSavingAccount(true);
    setError('');
    try {
      const response = await fetch('/api/admin/payment-account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ไม่สามารถบันทึกบัญชีรับโอนได้');
      setAccount(result.paymentAccount);
      setNotice('บันทึกบัญชีรับโอนเรียบร้อยแล้ว');
    } catch (saveError) {
      setError(saveError.message || 'ไม่สามารถบันทึกบัญชีรับโอนได้');
    } finally {
      setSavingAccount(false);
    }
  };

  const uploadQr = async (file) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('รองรับเฉพาะไฟล์รูปภาพ JPG, PNG หรือ WEBP');
      return;
    }
    if (file.size > MAX_QR_SIZE) {
      setError('ไฟล์ QR code ต้องมีขนาดไม่เกิน 2 MB');
      return;
    }
    setUploadingQr(true);
    setError('');
    try {
      const data = new FormData();
      data.append('qr', file);
      const response = await fetch('/api/admin/payment-account/qr', { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ไม่สามารถอัปโหลด QR code ได้');
      setAccount(result.paymentAccount);
      setNotice('อัปโหลด QR code เรียบร้อยแล้ว');
    } catch (uploadError) {
      setError(uploadError.message || 'ไม่สามารถอัปโหลด QR code ได้');
    } finally {
      setUploadingQr(false);
    }
  };

  const removeQr = async () => {
    setUploadingQr(true);
    setError('');
    try {
      const response = await fetch('/api/admin/payment-account/qr', { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ไม่สามารถลบ QR code ได้');
      setAccount(result.paymentAccount);
      setNotice('ลบ QR code แล้ว');
    } catch (removeError) {
      setError(removeError.message || 'ไม่สามารถลบ QR code ได้');
    } finally {
      setUploadingQr(false);
    }
  };

  if (accessError) return <AccessDenied message={accessError} />;

  return (
    <div>
      <header className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div><p className="text-sm text-accent-cyan font-medium mb-1">ADMIN · SUPABASE</p><h1 className="text-2xl sm:text-3xl font-semibold text-navy">ตรวจสอบสลิปสมาชิก</h1><p className="text-graydark/60 mt-1">ข้อมูลสลิปและสิทธิ์สมาชิกจัดเก็บในฐานข้อมูลกลาง</p></div>
        <div className="rounded-xl bg-navy text-white px-4 py-3 flex items-center gap-2 text-sm"><ShieldCheck size={18} className="text-accent-cyan" /> ผู้ดูแลระบบ</div>
      </header>

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

      <section className="border border-graylight/25 rounded-2xl p-5 sm:p-6 mb-6">
        <div className="flex items-center gap-3 mb-5"><div className="w-10 h-10 rounded-xl bg-accent-cyan/10 text-accent-cyan flex items-center justify-center"><Save size={20} /></div><div><h2 className="font-semibold text-navy">บัญชีรับโอน</h2><p className="text-xs text-graydark/50">จะแสดงให้สมาชิกที่เข้าสู่ระบบเท่านั้น</p></div></div>
        <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
          <form onSubmit={saveAccount} className="grid sm:grid-cols-3 gap-3 items-end">
            <label className="text-sm text-graydark">ธนาคาร<input value={account.bankName} onChange={(event) => setAccount((current) => ({ ...current, bankName: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-graylight/35 px-3 py-2.5 outline-none focus:border-accent-cyan" /></label>
            <label className="text-sm text-graydark">ชื่อบัญชี<input value={account.accountName} onChange={(event) => setAccount((current) => ({ ...current, accountName: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-graylight/35 px-3 py-2.5 outline-none focus:border-accent-cyan" /></label>
            <label className="text-sm text-graydark">เลขบัญชี<input value={account.accountNumber} onChange={(event) => setAccount((current) => ({ ...current, accountNumber: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-graylight/35 px-3 py-2.5 outline-none focus:border-accent-cyan" /></label>
            <button type="submit" disabled={savingAccount} className="sm:col-span-3 rounded-xl bg-navy text-white px-4 py-2.5 text-sm font-medium disabled:opacity-60 inline-flex items-center justify-center gap-2 sm:w-fit">{savingAccount && <LoaderCircle size={16} className="animate-spin" />}บันทึก</button>
          </form>
          <div className="shrink-0">
            <p className="text-sm text-graydark mb-1.5">QR code รับโอน</p>
            {account.qrCodeUrl ? (
              <div className="relative w-40">
                <img src={account.qrCodeUrl} alt="QR code รับโอน" className="w-40 h-40 rounded-xl border border-graylight/25 object-contain bg-white" />
                <button type="button" disabled={uploadingQr} onClick={removeQr} className="absolute -right-2 -top-2 rounded-full bg-white border border-graylight/30 p-1.5 text-red-500 shadow-sm hover:bg-red-50 disabled:opacity-60" aria-label="ลบ QR code">
                  {uploadingQr ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            ) : (
              <label className="flex w-40 h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-graylight/40 text-center text-graydark/55 hover:border-accent-cyan/60 hover:bg-accent-cyan/[0.02]">
                {uploadingQr ? <LoaderCircle size={22} className="animate-spin text-accent-cyan" /> : <><QrCode size={22} className="text-accent-cyan" /><span className="text-xs px-2">อัปโหลด QR code</span></>}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploadingQr} onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadQr(file); event.target.value = ''; }} />
              </label>
            )}
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="รอตรวจสอบ" value={counts.pending} icon={Clock3} tone="amber" />
        <StatCard label="อนุมัติแล้ว" value={counts.approved} icon={CheckCircle2} tone="green" />
        <StatCard label="ไม่อนุมัติ" value={counts.rejected} icon={XCircle} tone="red" />
      </section>

      <section className="flex items-center gap-2 flex-wrap border-b border-graylight/25 mb-5">
        {FILTERS.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px ${filter === item.id ? 'border-accent-cyan text-navy' : 'border-transparent text-graydark/55 hover:text-navy'}`}>{item.label}{item.id !== 'all' && <span className="ml-1.5 text-xs">{counts[item.id]}</span>}</button>)}
      </section>

      {loading ? <div className="h-52 rounded-2xl bg-graylight/10 animate-pulse" /> : visibleSlips.length === 0 ? (
        <section className="border border-dashed border-graylight/35 rounded-2xl py-16 text-center"><FileImage size={30} className="text-graydark/25 mx-auto mb-3" /><h2 className="font-medium text-navy">ไม่มีรายการในสถานะนี้</h2><p className="text-sm text-graydark/50 mt-1">สลิปที่ผู้ใช้อัปโหลดจะปรากฏที่นี่</p></section>
      ) : (
        <section className="space-y-4">{visibleSlips.map((slip) => <SlipCard key={slip.id} slip={slip} rejecting={rejectingId === slip.id} note={note} reviewing={reviewingId === slip.id} onNoteChange={setNote} onApprove={() => review(slip.id, 'approve')} onShowReject={() => { setRejectingId(slip.id); setNote(''); }} onCancelReject={() => setRejectingId(null)} onReject={() => review(slip.id, 'reject', note)} />)}</section>
      )}
    </div>
  );
}

function AccessDenied({ message }) {
  const loginRequired = message.includes('เข้าสู่ระบบ');
  return <div className="max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6"><div className="flex gap-3"><CircleAlert size={24} className="text-amber-700 shrink-0" /><div><h1 className="font-semibold text-amber-900">ยังเข้าหน้าผู้ดูแลไม่ได้</h1><p className="text-sm text-amber-800 mt-1 leading-relaxed">{message}{!loginRequired && ' ให้ตั้ง role ของบัญชีเป็น admin ในตาราง app_users ก่อน'}</p>{loginRequired && <Link href="/login" className="inline-flex items-center gap-2 mt-4 rounded-lg bg-amber-700 text-white px-3.5 py-2 text-sm font-medium"><LogIn size={16} /> เข้าสู่ระบบ</Link>}</div></div></div>;
}

function StatCard({ label, value, icon: Icon, tone }) {
  const tones = { amber: 'bg-amber-50 border-amber-100 text-amber-700', green: 'bg-emerald-50 border-emerald-100 text-emerald-700', red: 'bg-red-50 border-red-100 text-red-700' };
  return <article className={`border rounded-2xl p-5 ${tones[tone]}`}><Icon size={20} /><p className="text-2xl font-bold mt-3">{value}</p><p className="text-sm mt-1 opacity-80">{label}</p></article>;
}

function SlipCard({ slip, rejecting, note, reviewing, onNoteChange, onApprove, onShowReject, onCancelReject, onReject }) {
  const status = { pending: { label: 'รอตรวจสอบ', tone: 'bg-amber-50 text-amber-700' }, approved: { label: 'อนุมัติแล้ว', tone: 'bg-emerald-50 text-emerald-700' }, rejected: { label: 'ไม่อนุมัติ', tone: 'bg-red-50 text-red-700' } }[slip.status];
  return <article className="border border-graylight/25 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-5">
    {slip.imageUrl ? <img src={slip.imageUrl} alt={`สลิป ${slip.payer_name}`} className="w-full sm:w-40 h-44 sm:h-32 rounded-xl object-cover border border-graylight/20" /> : <div className="w-full sm:w-40 h-32 rounded-xl bg-graylight/10 flex items-center justify-center text-graydark/30"><FileImage size={30} /></div>}
    <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3 flex-wrap"><div><h2 className="font-semibold text-navy">{slip.payer_name}</h2><p className="text-sm text-graydark/55 mt-1">{slip.userPhone || 'ไม่พบเบอร์ผู้ใช้'} · {slip.plan_name}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.tone}`}>{status.label}</span></div><dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-4"><div><dt className="text-graydark/45 text-xs">ยอดโอน</dt><dd className="font-semibold text-navy">{formatCurrency(slip.amount)}</dd></div><div><dt className="text-graydark/45 text-xs">วันที่โอน</dt><dd className="font-medium text-graydark">{formatDate(slip.paid_at)}</dd></div><div><dt className="text-graydark/45 text-xs">ส่งเมื่อ</dt><dd className="font-medium text-graydark">{formatDate(slip.created_at, true)}</dd></div><div><dt className="text-graydark/45 text-xs">ไฟล์</dt><dd className="font-medium text-graydark truncate">{slip.original_filename}</dd></div></dl>{slip.reviewer_note && <p className="mt-3 text-sm rounded-lg bg-red-50 text-red-700 p-3">เหตุผล: {slip.reviewer_note}</p>}
      {slip.status === 'pending' && !rejecting && <div className="mt-5 flex gap-2 flex-wrap"><button type="button" disabled={reviewing} onClick={onApprove} className="inline-flex items-center gap-1.5 bg-emerald-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-emerald-700 disabled:opacity-60">{reviewing ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} อนุมัติและเปิดสิทธิ์</button><button type="button" disabled={reviewing} onClick={onShowReject} className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-red-50 disabled:opacity-60"><XCircle size={16} /> ไม่อนุมัติ</button></div>}
      {rejecting && <div className="mt-5 rounded-xl bg-red-50 border border-red-100 p-4"><label className="text-sm font-medium text-red-800">แจ้งเหตุผลให้ผู้ใช้<textarea value={note} onChange={(event) => onNoteChange(event.target.value)} rows={2} placeholder="เช่น ยอดเงินไม่ตรง หรือรูปสลิปไม่ชัดเจน" className="mt-2 w-full rounded-lg border border-red-200 bg-white p-2.5 text-sm text-graydark outline-none focus:border-red-400" /></label><div className="mt-3 flex gap-2"><button type="button" onClick={onReject} disabled={!note.trim() || reviewing} className="bg-red-600 text-white rounded-lg px-3.5 py-2 text-sm font-medium disabled:opacity-45">{reviewing ? 'กำลังบันทึก' : 'ยืนยันไม่อนุมัติ'}</button><button type="button" onClick={onCancelReject} className="text-graydark/60 px-3.5 py-2 text-sm">ยกเลิก</button></div></div>}
    </div>
  </article>;
}

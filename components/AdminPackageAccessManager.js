'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Crown,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  PackagePlus,
  PencilLine,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldOff,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/membership';
import { confirmDeletePlan } from '@/lib/sweetAlert';

const fieldClass = 'mt-1.5 field';
const permissionOptions = [
  { value: 'trial', label: 'เฉพาะชุดทดลอง' },
  { value: 'selected', label: 'เฉพาะชุดที่กำหนด' },
  { value: 'all', label: 'ทั้งหมด' },
];

function emptyPlan() {
  return {
    id: '', name: '', description: '', price: 0, durationDays: 365,
    _isNew: true,
    billingType: 'subscription', grantType: 'membership', paymentEnabled: false,
    isFeatured: false, isActive: true, sortOrder: 50, featureText: '',
    permissions: { practice: 'trial', mock: 'trial', randomQuiz: true, flashcards: false, knowledge: false, stats: true, calendar: true, aiTutor: false },
  };
}

function planToDraft(plan) {
  return { ...emptyPlan(), ...plan, _isNew: false, featureText: (plan.features || []).join('\n'), permissions: { ...emptyPlan().permissions, ...(plan.permissions || {}) } };
}

function expiryDate(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

function activeMembership(membership) {
  if (membership?.status !== 'active') return false;
  return !membership.expires_at || new Date(membership.expires_at) > new Date();
}

function StatusPill({ membership }) {
  if (!activeMembership(membership)) return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">ฟรี</span>;
  return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">{membership.plan_name || membership.plan_id}</span>;
}

export default function AdminPackageAccessManager() {
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [mockSets, setMockSets] = useState([]);
  const [draft, setDraft] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingAccess, setSavingAccess] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const [plansResponse, accessResponse] = await Promise.all([
        fetch('/api/admin/plans', { cache: 'no-store' }),
        fetch('/api/admin/access', { cache: 'no-store' }),
      ]);
      const [plansResult, accessResult] = await Promise.all([plansResponse.json(), accessResponse.json()]);
      if (!plansResponse.ok) throw new Error(plansResult.error || 'ไม่สามารถโหลดแพ็กเกจได้');
      if (!accessResponse.ok) throw new Error(accessResult.error || 'ไม่สามารถโหลดสิทธิ์ผู้ใช้ได้');
      setPlans(plansResult.plans || []);
      setUsers(accessResult.users || []);
      setMockSets(accessResult.mockSets || []);
    } catch (loadError) {
      setError(loadError.message || 'ไม่สามารถโหลดข้อมูลผู้ดูแลได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const visibleUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => [user.username, user.phone, user.email].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [query, users]);
  const selectedUser = users.find((user) => user.id === selectedUserId) || null;
  const activeMembers = users.filter((user) => activeMembership(user.membership)).length;
  const activeGrants = users.reduce((total, user) => total + (user.grants || []).filter((grant) => grant.status === 'active').length, 0);

  const setDraftValue = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const setPermission = (key, value) => setDraft((current) => ({ ...current, permissions: { ...current.permissions, [key]: value } }));

  const savePlan = async (event) => {
    event.preventDefault();
    if (!draft) return;
    setSavingPlan(true);
    setError('');
    try {
      const payload = {
        ...draft,
        price: Number(draft.price || 0),
        durationDays: draft.durationDays ? Number(draft.durationDays) : null,
        sortOrder: Number(draft.sortOrder || 0),
        features: draft.featureText.split('\n').map((item) => item.trim()).filter(Boolean),
      };
      const isNew = draft._isNew;
      const response = await fetch('/api/admin/plans', {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ไม่สามารถบันทึกแพ็กเกจได้');
      setNotice(isNew ? 'สร้างแพ็กเกจใหม่เรียบร้อยแล้ว' : 'บันทึกการตั้งค่าแพ็กเกจแล้ว');
      setDraft(null);
      await refresh();
    } catch (saveError) {
      setError(saveError.message || 'ไม่สามารถบันทึกแพ็กเกจได้');
    } finally {
      setSavingPlan(false);
    }
  };

  const deletePlan = async (plan) => {
    if (!await confirmDeletePlan(plan.name)) return;
    setSavingPlan(true);
    setError('');
    try {
      const response = await fetch('/api/admin/plans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plan.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ลบแพ็กเกจไม่สำเร็จ');
      setNotice('ลบแพ็กเกจแล้ว');
      if (draft?.id === plan.id) setDraft(null);
      await refresh();
    } catch (deleteError) {
      setError(deleteError.message || 'ลบแพ็กเกจไม่สำเร็จ');
    } finally {
      setSavingPlan(false);
    }
  };

  const movePlan = async (plan, direction) => {
    const sorted = [...plans].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    const index = sorted.findIndex((item) => item.id === plan.id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];

    setSavingPlan(true);
    setError('');
    try {
      const updates = reordered
        .map((item, position) => ({ item, sortOrder: (position + 1) * 10 }))
        .filter(({ item, sortOrder }) => sortOrder !== item.sortOrder);
      await Promise.all(updates.map(async ({ item, sortOrder }) => {
        const response = await fetch('/api/admin/plans', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id, sortOrder }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'ย้ายตำแหน่งไม่สำเร็จ');
      }));
      await refresh();
    } catch (moveError) {
      setError(moveError.message || 'ย้ายตำแหน่งไม่สำเร็จ');
    } finally {
      setSavingPlan(false);
    }
  };

  const updateAccess = async (payload, successMessage) => {
    setSavingAccess(true);
    setError('');
    try {
      const response = await fetch('/api/admin/access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ไม่สามารถบันทึกสิทธิ์ได้');
      setNotice(result.message || successMessage);
      await refresh();
    } catch (saveError) {
      setError(saveError.message || 'ไม่สามารถบันทึกสิทธิ์ได้');
    } finally {
      setSavingAccess(false);
    }
  };

  return (
    <div>
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-medium text-accent-cyan">ADMIN · PACKAGE & ACCESS</p>
          <h1 className="text-2xl font-semibold text-navy sm:text-3xl">แพ็กเกจและสิทธิ์ผู้ใช้</h1>
          <p className="mt-1 max-w-3xl text-sm text-graydark/60">แก้ชื่อ ราคา ระยะเวลา และขอบเขตสิทธิ์ของแพ็กเกจได้จากที่เดียว พร้อมเปิดหรือยกเลิกสิทธิ์รายคนและเฉพาะชุด Mock</p>
        </div>
        <button type="button" onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 btn-outline disabled:opacity-60"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />รีเฟรชข้อมูล</button>
      </header>

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><span className="inline-flex items-center gap-2"><CheckCircle2 size={17} />{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="ปิดข้อความ"><X size={16} /></button></div>}

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={PackagePlus} label="แพ็กเกจที่เปิดอยู่" value={plans.filter((plan) => plan.isActive).length} tone="cyan" />
        <StatCard icon={UsersRound} label="สมาชิกที่มีสิทธิ์" value={activeMembers} tone="green" />
        <StatCard icon={KeyRound} label="สิทธิ์เฉพาะชุดที่ใช้งาน" value={activeGrants} tone="amber" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-semibold text-navy">ตั้งค่าแพ็กเกจ</h2><p className="mt-1 text-xs text-graydark/55">การปิดใช้งานแพ็กเกจจะซ่อนจากหน้าสมาชิก แต่ไม่กระทบสิทธิ์เดิมที่มีอยู่</p></div>
          <button type="button" onClick={() => setDraft(emptyPlan())} className="inline-flex items-center gap-2 rounded-xl bg-navy px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-navy/90"><Plus size={16} />สร้างแพ็กเกจ</button>
        </div>
        {loading ? <div className="mt-5 h-36 skeleton" /> : <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{[...plans].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)).map((plan, index, sorted) => <PlanCard key={plan.id} plan={plan} saving={savingPlan} canMoveUp={index > 0} canMoveDown={index < sorted.length - 1} onEdit={() => setDraft(planToDraft(plan))} onDelete={() => deletePlan(plan)} onMoveUp={() => movePlan(plan, 'up')} onMoveDown={() => movePlan(plan, 'down')} />)}</div>}
      </section>

      {draft && <PlanEditor draft={draft} saving={savingPlan} onChange={setDraftValue} onPermission={setPermission} onCancel={() => setDraft(null)} onSubmit={savePlan} />}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-semibold text-navy">จัดการสิทธิ์รายคน</h2><p className="mt-1 text-xs text-graydark/55">กำหนด VIP หรือสิทธิ์ชุด Mock รายคนได้ทันที โดยไม่ต้องรอการชำระเงิน</p></div>
          <label className="relative block w-full sm:w-80"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อ เบอร์โทร หรืออีเมล" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent-cyan" /></label>
        </div>
        {loading ? <div className="mt-5 h-52 skeleton" /> : visibleUsers.length === 0 ? <EmptyUsers /> : <div className="mt-5 overflow-hidden rounded-xl border border-slate-100"><div className="max-h-[37rem] divide-y divide-slate-100 overflow-y-auto">{visibleUsers.map((user) => <UserRow key={user.id} user={user} selected={user.id === selectedUserId} onSelect={() => setSelectedUserId((current) => current === user.id ? null : user.id)} />)}</div></div>}
      </section>

      {selectedUser && <UserAccessEditor key={selectedUser.id} user={selectedUser} plans={plans} mockSets={mockSets} saving={savingAccess} onClose={() => setSelectedUserId(null)} onUpdate={updateAccess} />}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  const tones = { cyan: 'border-cyan-100 bg-cyan-50 text-cyan-700', green: 'border-emerald-100 bg-emerald-50 text-emerald-700', amber: 'border-amber-100 bg-amber-50 text-amber-700' };
  return <article className={`rounded-2xl border p-4 ${tones[tone]}`}><Icon size={19} /><p className="mt-3 text-2xl font-bold">{value}</p><p className="mt-1 text-sm opacity-80">{label}</p></article>;
}

function PlanCard({ plan, saving, canMoveUp, canMoveDown, onEdit, onDelete, onMoveUp, onMoveDown }) {
  return <article className={`relative rounded-2xl border p-4 ${plan.isFeatured ? 'border-accent-cyan bg-cyan-50/40' : 'border-slate-200 bg-white'}`}>
    <div className="flex items-start justify-between gap-2">
      <div><p className="text-xs font-medium text-graydark/50">{plan.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} · {plan.grantType === 'membership' ? 'สิทธิ์สมาชิก' : plan.grantType === 'exam_set' ? 'สิทธิ์รายชุด' : 'ทดลอง'}</p><h3 className="mt-1 font-semibold text-navy">{plan.name}</h3></div>
      <div className="flex items-center gap-1">
        {plan.isFeatured && <Crown size={18} className="text-amber-500" />}
        <button type="button" disabled={saving || !canMoveUp} onClick={onMoveUp} aria-label={`ย้าย ${plan.name} ขึ้น`} className="rounded-lg p-1.5 text-graydark/50 hover:bg-slate-100 hover:text-navy disabled:cursor-not-allowed disabled:opacity-30"><ArrowUp size={14} /></button>
        <button type="button" disabled={saving || !canMoveDown} onClick={onMoveDown} aria-label={`ย้าย ${plan.name} ลง`} className="rounded-lg p-1.5 text-graydark/50 hover:bg-slate-100 hover:text-navy disabled:cursor-not-allowed disabled:opacity-30"><ArrowDown size={14} /></button>
      </div>
    </div>
    <p className="mt-3 text-2xl font-bold text-navy">{formatCurrency(plan.price)}{plan.durationDays && <span className="ml-1 text-xs font-medium text-graydark/55">/ {plan.durationDays} วัน</span>}</p>
    <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-graydark/60">{plan.description || 'ยังไม่ได้ใส่คำอธิบาย'}</p>
    <div className="mt-4 flex items-center justify-between gap-2">
      <span className="text-xs text-graydark/50">สมาชิกใช้งาน {plan.activeMembers || 0} คน</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-navy hover:border-accent-cyan hover:text-accent-cyan"><PencilLine size={13} />แก้ไข</button>
        {plan.id !== 'free' && <button type="button" disabled={saving} onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={13} />ลบ</button>}
      </div>
    </div>
  </article>;
}

function PlanEditor({ draft, saving, onChange, onPermission, onCancel, onSubmit }) {
  const isNew = draft._isNew;
  const isFree = draft.billingType === 'free';
  return <section className="mt-6 rounded-2xl border-2 border-navy/10 bg-slate-50 p-4 shadow-sm sm:p-6"><form onSubmit={onSubmit}>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-navy">{isNew ? 'สร้างแพ็กเกจใหม่' : `แก้ไขแพ็กเกจ: ${draft.name}`}</h2><p className="mt-1 text-xs text-graydark/55">สิทธิ์จะมีผลกับผู้ใช้ที่ได้รับแพ็กเกจนี้ทันทีในการตรวจสอบข้อสอบครั้งถัดไป</p></div><button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-sm text-graydark/60 hover:bg-white">ยกเลิก</button></div>
    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <label className="text-sm font-medium text-graydark">รหัสแพ็กเกจ<input required disabled={!isNew} value={draft.id} onChange={(event) => onChange('id', event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="เช่น vip-1y" className={`${fieldClass} disabled:bg-slate-100 disabled:text-slate-400`} /></label>
      <label className="text-sm font-medium text-graydark">ชื่อแพ็กเกจ<input required value={draft.name} onChange={(event) => onChange('name', event.target.value)} className={fieldClass} /></label>
      <label className="text-sm font-medium text-graydark">ราคา (บาท)<input required min="0" type="number" value={draft.price} onChange={(event) => onChange('price', event.target.value)} className={fieldClass} /></label>
      <label className="text-sm font-medium text-graydark">ระยะเวลา (วัน)<input min="1" type="number" disabled={isFree} value={draft.durationDays || ''} onChange={(event) => onChange('durationDays', event.target.value)} placeholder="เว้นว่างหากไม่หมดอายุ" className={`${fieldClass} disabled:bg-slate-100`} /></label>
      <label className="text-sm font-medium text-graydark">รูปแบบราคา<select value={draft.billingType} onChange={(event) => { onChange('billingType', event.target.value); if (event.target.value === 'free') onChange('price', 0); }} className={fieldClass}><option value="free">ฟรี</option><option value="one_time">ชำระครั้งเดียว</option><option value="subscription">สมาชิกตามระยะเวลา</option></select></label>
      <label className="text-sm font-medium text-graydark">การให้สิทธิ์<select value={draft.grantType} onChange={(event) => { onChange('grantType', event.target.value); if (event.target.value !== 'membership') onChange('paymentEnabled', false); }} className={fieldClass}><option value="membership">สิทธิ์สมาชิก</option><option value="exam_set">สิทธิ์เฉพาะชุด Mock</option><option value="manual">สิทธิ์ทดลอง/กำหนดเอง</option></select></label>
      <label className="text-sm font-medium text-graydark">ลำดับแสดง<input type="number" value={draft.sortOrder} onChange={(event) => onChange('sortOrder', event.target.value)} className={fieldClass} /></label>
      <div className="flex flex-wrap content-end gap-x-4 gap-y-2 pb-1 text-sm text-graydark"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={draft.isActive} onChange={(event) => onChange('isActive', event.target.checked)} />เปิดใช้</label><label className="inline-flex items-center gap-2"><input type="checkbox" checked={draft.isFeatured} onChange={(event) => onChange('isFeatured', event.target.checked)} />แนะนำ</label><label className="inline-flex items-center gap-2"><input type="checkbox" disabled={draft.grantType !== 'membership' || isFree} checked={draft.paymentEnabled} onChange={(event) => onChange('paymentEnabled', event.target.checked)} />ชำระด้วยสลิป</label></div>
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2"><label className="text-sm font-medium text-graydark">คำอธิบาย<textarea rows={4} value={draft.description} onChange={(event) => onChange('description', event.target.value)} className={fieldClass} /></label><label className="text-sm font-medium text-graydark">สิทธิประโยชน์ (หนึ่งบรรทัดต่อหนึ่งข้อ)<textarea rows={4} value={draft.featureText} onChange={(event) => onChange('featureText', event.target.value)} className={fieldClass} /></label></div>
    <fieldset className="mt-5 rounded-xl border border-slate-200 bg-white p-4"><legend className="px-1 text-sm font-semibold text-navy">ขอบเขตสิทธิ์</legend><div className="mt-2 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><PermissionSelect label="แบบฝึกหัด" value={draft.permissions.practice} onChange={(value) => onPermission('practice', value)} /><PermissionSelect label="Mock Exam" value={draft.permissions.mock} onChange={(value) => onPermission('mock', value)} />{['randomQuiz', 'flashcards', 'knowledge', 'stats', 'calendar', 'aiTutor'].map((key) => <label key={key} className="inline-flex items-center gap-2 text-sm text-graydark"><input type="checkbox" checked={Boolean(draft.permissions[key])} onChange={(event) => onPermission(key, event.target.checked)} />{({ randomQuiz: 'Random Quiz', flashcards: 'Flashcards', knowledge: 'คลังความรู้', stats: 'สถิติ', calendar: 'ปฏิทิน', aiTutor: 'ครูฝึก AI' })[key]}</label>)}</div></fieldset>
    <div className="mt-5 flex justify-end"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-60">{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}บันทึกแพ็กเกจ</button></div>
  </form></section>;
}

function PermissionSelect({ label, value, onChange }) {
  return <label className="text-sm font-medium text-graydark">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass}>{permissionOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>;
}

function UserRow({ user, selected, onSelect }) {
  return <button type="button" onClick={onSelect} className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${selected ? 'bg-cyan-50/70' : 'bg-white'}`}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy/10 text-sm font-bold text-navy">{String(user.username || user.phone || '?').slice(0, 1).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-navy">{user.username || 'ยังไม่ได้ตั้งชื่อผู้ใช้'} {user.role === 'admin' && <span className="ml-1 rounded bg-navy px-1.5 py-0.5 text-[10px] text-white">ADMIN</span>}{user.status && user.status !== 'active' && <span className="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">ระงับ</span>}</span><span className="block truncate text-xs text-graydark/55">{user.phone}{user.email ? ` · ${user.email}` : ''}</span></span><span className="hidden min-w-0 text-right sm:block"><StatusPill membership={user.membership} /><span className="mt-1 block max-w-36 truncate text-[11px] text-graydark/50">{user.grants?.length ? `สิทธิ์รายชุด ${user.grants.length} รายการ` : 'ไม่มีสิทธิ์รายชุด'}</span></span><ChevronDown size={17} className={`shrink-0 text-slate-400 transition ${selected ? 'rotate-180' : ''}`} /></button>;
}

function UserAccessEditor({ user, plans, mockSets, saving, onClose, onUpdate }) {
  const membershipPlans = plans.filter((plan) => plan.grantType === 'membership' && plan.isActive);
  const [planId, setPlanId] = useState(activeMembership(user.membership) ? user.membership.plan_id : 'free');
  const [membershipExpiry, setMembershipExpiry] = useState(expiryDate(user.membership?.expires_at));
  const [setId, setSetId] = useState('');
  const [grantExpiry, setGrantExpiry] = useState('');
  const [note, setNote] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const isSuspended = Boolean(user.status && user.status !== 'active');
  const userGrants = (user.grants || []).filter((grant) => grant.status === 'active');

  return <section className="mt-6 rounded-2xl border-2 border-accent-cyan/25 bg-cyan-50/40 p-4 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-accent-cyan"><UserRound size={21} /></span><div><h2 className="font-semibold text-navy">สิทธิ์ของ {user.username || user.phone}</h2><p className="mt-1 text-xs text-graydark/60">{user.phone}{user.email ? ` · ${user.email}` : ''}</p></div></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-graydark/55 hover:bg-white" aria-label="ปิด"><X size={18} /></button></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2"><form onSubmit={(event) => { event.preventDefault(); onUpdate({ action: 'membership', userId: user.id, planId, expiresAt: membershipExpiry, note }, 'บันทึกสิทธิ์สมาชิกแล้ว'); }} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2"><Crown size={18} className="text-amber-500" /><h3 className="font-semibold text-navy">แพ็กเกจหลัก</h3></div><p className="mt-1 text-xs text-graydark/55">เลือก “ฟรี” เพื่อยกเลิกสิทธิ์แบบชำระเงิน แต่ข้อมูลการชำระเดิมจะยังถูกเก็บไว้</p><label className="mt-4 block text-sm font-medium text-graydark">แพ็กเกจ<select value={planId} onChange={(event) => setPlanId(event.target.value)} className={fieldClass}><option value="free">ฟรี — จำกัดเฉพาะชุดทดลอง</option>{membershipPlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {formatCurrency(plan.price)}</option>)}</select></label><label className="mt-3 block text-sm font-medium text-graydark">หมดอายุ (เว้นว่างให้ใช้ระยะเวลาของแพ็กเกจ)<input type="date" value={membershipExpiry} onChange={(event) => setMembershipExpiry(event.target.value)} className={fieldClass} /></label><label className="mt-3 block text-sm font-medium text-graydark">หมายเหตุภายใน<textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} className={fieldClass} placeholder="เช่น มอบสิทธิ์จากกิจกรรม" /></label><button type="submit" disabled={saving} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving && <LoaderCircle size={16} className="animate-spin" />}บันทึกสิทธิ์แพ็กเกจ</button></form>
      <form onSubmit={(event) => { event.preventDefault(); onUpdate({ action: 'grantExamSet', userId: user.id, setId, expiresAt: grantExpiry, note }, 'เปิดสิทธิ์ชุด Mock แล้ว'); }} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2"><KeyRound size={18} className="text-accent-cyan" /><h3 className="font-semibold text-navy">สิทธิ์เฉพาะชุด Mock</h3></div><p className="mt-1 text-xs text-graydark/55">เหมาะกับแพ็กเกจ Mock รายชุด และใช้ได้แม้ผู้ใช้ไม่ได้เป็น VIP</p><label className="mt-4 block text-sm font-medium text-graydark">ชุด Mock<select required value={setId} onChange={(event) => setSetId(event.target.value)} className={fieldClass}><option value="">เลือกชุดข้อสอบ</option>{mockSets.map((set) => <option key={set.id} value={set.id}>{set.title}{set.is_free ? ' (ชุดทดลองฟรี)' : ''}</option>)}</select></label><label className="mt-3 block text-sm font-medium text-graydark">หมดอายุ (ไม่บังคับ)<input type="date" value={grantExpiry} onChange={(event) => setGrantExpiry(event.target.value)} className={fieldClass} /></label><button type="submit" disabled={saving || !setId} className="mt-[4.55rem] inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-cyan px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving && <LoaderCircle size={16} className="animate-spin" />}เปิดสิทธิ์ชุดนี้</button></form></div>
    <div className={`mt-5 rounded-xl border p-4 ${isSuspended ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}><div className="flex items-center gap-2"><ShieldOff size={18} className={isSuspended ? 'text-red-600' : 'text-graydark/60'} /><h3 className="font-semibold text-navy">สถานะบัญชี</h3>{isSuspended && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">ถูกระงับอยู่</span>}</div>{isSuspended ? <><p className="mt-2 text-sm text-red-800">เหตุผล: {user.suspended_reason || 'ไม่ได้ระบุ'}</p><p className="mt-1 text-xs text-graydark/60">ผู้ใช้รายนี้เรียก API ไม่ได้และล็อกอินใหม่ไม่ได้จนกว่าจะคืนสิทธิ์</p><button type="button" disabled={saving} onClick={() => onUpdate({ action: 'accountStatus', userId: user.id, suspend: false }, 'คืนสิทธิ์การใช้งานแล้ว')} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving && <LoaderCircle size={16} className="animate-spin" />}คืนสิทธิ์การใช้งาน</button></> : <><p className="mt-1 text-xs text-graydark/55">ระงับแล้วผู้ใช้จะถูกตัดออกจากระบบทันที และขอ OTP เข้าใหม่ไม่ได้</p><label className="mt-3 block text-sm font-medium text-graydark">เหตุผล (แสดงให้ผู้ใช้เห็น)<input value={suspendReason} onChange={(event) => setSuspendReason(event.target.value)} placeholder="เช่น แชร์บัญชีให้ผู้อื่น" className={fieldClass} /></label><button type="button" disabled={saving || user.role === 'admin'} onClick={() => onUpdate({ action: 'accountStatus', userId: user.id, suspend: true, reason: suspendReason }, 'ระงับบัญชีแล้ว')} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-danger px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving && <LoaderCircle size={16} className="animate-spin" />}ระงับบัญชีนี้</button>{user.role === 'admin' && <p className="mt-2 text-xs text-graydark/50">บัญชีผู้ดูแลระบบระงับไม่ได้</p>}</>}</div>
    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2"><BadgeCheck size={18} className="text-emerald-600" /><h3 className="font-semibold text-navy">สิทธิ์เฉพาะชุดที่ใช้งาน</h3></div>{userGrants.length === 0 ? <p className="mt-3 text-sm text-graydark/55">ยังไม่มีสิทธิ์เฉพาะชุด</p> : <div className="mt-3 flex flex-wrap gap-2">{userGrants.map((grant) => <span key={grant.id} className="inline-flex items-center gap-2 rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-navy"><LockKeyhole size={13} />{mockSets.find((set) => set.id === grant.resource_id)?.title || 'ชุดข้อสอบที่ถูกลบ'}{grant.expires_at && <span className="text-graydark/50">ถึง {formatDate(grant.expires_at)}</span>}<button type="button" disabled={saving} onClick={() => onUpdate({ action: 'revokeGrant', userId: user.id, grantId: grant.id }, 'ยกเลิกสิทธิ์เฉพาะชุดแล้ว')} className="text-red-500 hover:text-red-700" aria-label="ยกเลิกสิทธิ์"><Trash2 size={14} /></button></span>)}</div>}</div>
  </section>;
}

function EmptyUsers() {
  return <div className="mt-5 rounded-xl border border-dashed border-slate-200 py-12 text-center"><ShieldCheck size={26} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-medium text-navy">ไม่พบผู้ใช้ตามที่ค้นหา</p></div>;
}

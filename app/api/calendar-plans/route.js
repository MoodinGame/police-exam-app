import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

function requestError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function mapPlan(plan) {
  return {
    id: plan.id,
    title: plan.title,
    date: plan.plan_date,
    type: plan.plan_type,
    subjectId: plan.subject_id || '',
    duration: plan.duration_minutes || 0,
    time: plan.time_of_day ? String(plan.time_of_day).slice(0, 5) : '',
    isPersonal: true,
  };
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('calendar_plans')
      .select('id, title, plan_date, plan_type, subject_id, duration_minutes, time_of_day')
      .eq('user_id', user.id)
      .order('plan_date')
      .order('time_of_day');
    if (error) throw error;
    return NextResponse.json({ plans: (data || []).map(mapPlan) });
  } catch (error) {
    if (error?.code === '42P01') return NextResponse.json({ plans: [], source: 'unavailable' });
    const status = error?.status || 500;
    return NextResponse.json({ error: status === 500 ? 'ไม่สามารถโหลดแผนการเรียนได้' : error.message }, { status });
  }
}

export async function POST(request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const title = String(body.title || '').trim();
    const planDate = String(body.date || '');
    const planType = ['study', 'practice'].includes(body.type) ? body.type : 'study';
    const subjectId = body.subjectId ? String(body.subjectId) : null;
    const duration = Math.min(Math.max(Number(body.duration) || 0, 0), 1440);
    const time = body.time && /^\d{2}:\d{2}$/.test(body.time) ? body.time : null;
    if (!title || title.length > 160) throw requestError('กรุณาระบุชื่อแผนไม่เกิน 160 ตัวอักษร');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(planDate)) throw requestError('กรุณาระบุวันที่ให้ถูกต้อง');

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('calendar_plans')
      .insert({
        user_id: user.id,
        title,
        plan_date: planDate,
        plan_type: planType,
        subject_id: subjectId,
        duration_minutes: duration,
        time_of_day: time,
      })
      .select('id, title, plan_date, plan_type, subject_id, duration_minutes, time_of_day')
      .single();
    if (error) throw error;
    return NextResponse.json({ plan: mapPlan(data) }, { status: 201 });
  } catch (error) {
    const status = error?.status || 500;
    return NextResponse.json({ error: status === 500 ? 'ไม่สามารถบันทึกแผนการเรียนได้' : error.message }, { status });
  }
}

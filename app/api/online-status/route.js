import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

// ถือว่า "ออนไลน์อยู่ตอนนี้" ถ้าส่ง heartbeat มาในช่วงนี้
const ONLINE_WINDOW_SECONDS = 45;
// กันหน้าเว็บดูเงียบตอนคนน้อย — ถ้าคนจริงมากกว่านี้จะแสดงตามจริง ไม่ใช่ตัวเลขปลอมลอย ๆ
const MIN_DISPLAYED_ONLINE = 5;
const STALE_ROW_HOURS = 2;

function isValidClientId(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 100;
}

// '42P01' = Postgres undefined_table, 'PGRST205' = PostgREST schema-cache miss (ยังไม่ได้รัน migration ของตารางนี้)
function missingTable(error) {
  return error?.code === '42P01' || error?.code === 'PGRST205';
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!isValidClientId(body?.clientId)) {
      return NextResponse.json({ error: 'ไม่พบ clientId ที่ถูกต้อง' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const nowIso = new Date().toISOString();

    const { error: upsertError } = await supabase
      .from('site_presence')
      .upsert({ client_id: body.clientId, last_seen_at: nowIso });
    if (upsertError) {
      // ยังไม่ได้รันไฟล์ migration ของตารางนี้ในฐานข้อมูล — แสดงค่าขั้นต่ำไปก่อน ไม่ให้หน้าแรกพัง
      if (missingTable(upsertError)) return NextResponse.json({ online: MIN_DISPLAYED_ONLINE });
      throw upsertError;
    }

    // เก็บกวาดแถวเก่าที่ไม่มีใครกลับมาต่อ heartbeat แล้ว ไม่ให้ตารางโตไม่มีที่สิ้นสุด
    await supabase
      .from('site_presence')
      .delete()
      .lt('last_seen_at', new Date(Date.now() - STALE_ROW_HOURS * 3600 * 1000).toISOString());

    const since = new Date(Date.now() - ONLINE_WINDOW_SECONDS * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('site_presence')
      .select('client_id', { count: 'exact', head: true })
      .gte('last_seen_at', since);
    if (countError) throw countError;

    return NextResponse.json({ online: Math.max(count || 0, MIN_DISPLAYED_ONLINE) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

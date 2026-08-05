import { NextResponse } from 'next/server';
import { getUserAccess } from '@/lib/serverAccess';
import { requireCurrentUser } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

function isVisibleNow(item, now) {
  const startsAt = item.starts_at ? new Date(item.starts_at) : null;
  const endsAt = item.ends_at ? new Date(item.ends_at) : null;
  return (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const supabase = getSupabaseAdmin();
    const [announcementsResult, access] = await Promise.all([
      supabase
        .from('announcements')
        .select('id, title, summary, body, tone, audience, show_on_login, starts_at, ends_at, updated_at, created_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(40),
      getUserAccess(supabase, user.id),
    ]);

    if (announcementsResult.error) throw announcementsResult.error;
    const now = new Date();
    const isMember = access.isMember;
    const audience = isMember ? 'member' : 'free';
    const announcements = (announcementsResult.data || []).filter((item) => (
      isVisibleNow(item, now) && (item.audience === 'all' || item.audience === audience)
    ));

    return NextResponse.json({ announcements, isMember });
  } catch (error) {
    // A missing announcement table should not block the rest of the app while
    // an administrator is still applying the content-management migration.
    if (error?.code === '42P01') return NextResponse.json({ announcements: [] });
    const status = error?.status || 500;
    return NextResponse.json({ error: status === 500 ? 'ไม่สามารถโหลดประกาศได้' : error.message }, { status });
  }
}

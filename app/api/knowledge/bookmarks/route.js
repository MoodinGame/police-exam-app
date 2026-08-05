import { NextResponse } from 'next/server';
import { apiErrorResponse, requireCurrentUser } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

function requestError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function migrationPending(error) {
  return error?.code === '42P01' || error?.code === 'PGRST205';
}

async function listBookmarks(supabase, userId) {
  const { data, error } = await supabase
    .from('knowledge_bookmarks')
    .select('topic_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => row.topic_id);
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const topicIds = await listBookmarks(getSupabaseAdmin(), user.id);
    return NextResponse.json({ topicIds, source: 'database' });
  } catch (error) {
    if (migrationPending(error)) return NextResponse.json({ topicIds: [], source: 'unavailable' });
    return apiErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireCurrentUser();
    const topicId = String((await request.json())?.topicId || '').trim();
    if (!topicId) throw requestError('กรุณาระบุหัวข้อที่ต้องการบันทึก');

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('knowledge_bookmarks').upsert({ user_id: user.id, topic_id: topicId });
    if (error) throw error;
    return NextResponse.json({ topicIds: await listBookmarks(supabase, user.id) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request) {
  try {
    const user = await requireCurrentUser();
    const topicId = new URL(request.url).searchParams.get('topic')?.trim();
    if (!topicId) throw requestError('กรุณาระบุหัวข้อที่ต้องการลบ');

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('knowledge_bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('topic_id', topicId);
    if (error) throw error;
    return NextResponse.json({ topicIds: await listBookmarks(supabase, user.id) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

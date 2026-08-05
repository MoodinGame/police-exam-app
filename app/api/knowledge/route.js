import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const [subjectsResult, topicsResult, articlesResult] = await Promise.all([
      supabase
        .from('content_subjects')
        .select('id, name, short_name, description, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),
      supabase
        .from('content_topics')
        .select('id, legacy_id, subject_id, name, description, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),
      supabase
        .from('knowledge_articles')
        .select('id, subject_id, topic_id, title, summary, body, key_points, pitfalls, exam_guide, sort_order, updated_at')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('updated_at', { ascending: false }),
    ]);

    const firstError = subjectsResult.error || topicsResult.error || articlesResult.error;
    if (firstError) throw firstError;

    return NextResponse.json({
      subjects: subjectsResult.data || [],
      topics: topicsResult.data || [],
      articles: articlesResult.data || [],
      source: 'database',
    });
  } catch (error) {
    // A fresh project may not have had the migration applied yet. The learner
    // screen intentionally falls back to the curated static syllabus.
    if (error?.code === '42P01' || error?.code === 'PGRST205') {
      return NextResponse.json({ subjects: [], topics: [], articles: [], source: 'unavailable' });
    }

    return NextResponse.json({ error: 'ไม่สามารถโหลดคลังความรู้ได้' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { canAccessExamSet, getUserAccess } from '@/lib/serverAccess';
import { findUserByPhone, getSessionPhone } from '@/lib/serverUser';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

function isOptionalHierarchySchemaError(error) {
  return ['42P01', '42703', 'PGRST204', 'PGRST205'].includes(error?.code);
}

function mapSet(item, access) {
  const questionCount = item.exam_set_questions?.[0]?.count || 0;
  return {
    id: item.id,
    slug: item.slug,
    bank: item.bank,
    title: item.title,
    description: item.description || '',
    subjectId: item.subject_id,
    subjectName: item.content_subjects?.name || item.subject_id,
    topicId: item.topic_id,
    topicName: item.content_topics?.name || '',
    legacyTopicId: item.content_topics?.legacy_id || null,
    durationMinutes: item.duration_minutes,
    difficulty: item.difficulty || 'medium',
    isFree: Boolean(item.is_free),
    questionCount,
    canAccess: canAccessExamSet(access, item),
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedBank = searchParams.get('bank');
    const bank = requestedBank === 'mock' ? 'mock' : 'practice';
    const subjectId = searchParams.get('subject')?.trim() || null;
    const supabase = getSupabaseAdmin();

    let user = null;
    let access = null;
    const phone = await getSessionPhone();
    if (phone) {
      user = await findUserByPhone(phone);
      if (user) access = await getUserAccess(supabase, user.id);
    }

    let setQuery = supabase
      .from('exam_sets')
      .select('id, slug, bank, title, description, subject_id, topic_id, duration_minutes, difficulty, is_free, content_subjects(name), content_topics(name, legacy_id), exam_set_questions(count)')
      .eq('bank', bank)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200);
    if (subjectId) setQuery = setQuery.eq('subject_id', subjectId);

    // PostgREST ส่งกลับสูงสุด 1000 แถวต่อคำขอ (.limit() ที่มากกว่านั้นไม่ช่วย) จึงต้องไล่ทีละหน้า
    // ไม่งั้นพอข้อสอบเกิน 1000 ข้อ หัวข้อที่อยู่หลังจากนั้นจะนับไม่ได้และการ์ดจะขึ้น "ยังไม่เปิดให้ทำ"
    const PAGE_SIZE = 1000;
    const loadQuestionTopicIds = async () => {
      const collected = [];
      for (let page = 0; page < 50; page += 1) {
        let query = supabase
          .from('question_bank_questions')
          .select('topic_id')
          .eq('bank', bank)
          .eq('is_active', true)
          .not('topic_id', 'is', null)
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (subjectId) query = query.eq('subject_id', subjectId);
        const { data, error } = await query;
        if (error) throw error;
        collected.push(...(data || []));
        if ((data || []).length < PAGE_SIZE) break;
      }
      return collected;
    };

    const [
      { data: sets, error: setsError },
      { data: subjects, error: subjectsError },
      { data: topics, error: topicsError },
      questionTopics,
    ] = await Promise.all([
      setQuery,
      supabase.from('content_subjects').select('id, name, short_name, description, accent, sort_order').eq('is_active', true).order('sort_order'),
      supabase.from('content_topics').select('id, legacy_id, subject_id, name, description, sort_order').eq('is_active', true).order('sort_order'),
      loadQuestionTopicIds(),
    ]);
    if (setsError) throw setsError;
    if (subjectsError) throw subjectsError;
    if (topicsError) throw topicsError;

    // โครงสร้างลำดับชั้น (parent_id / is_free_practice) เพิ่มทีหลัง — ถ้ายังไม่ได้รัน migration
    // ให้ถือว่าทุกหัวข้อเป็นหัวข้อหลักและยังไม่มีหัวข้อฟรี เพื่อให้หน้าผู้เรียนยังใช้งานได้
    let nestedTopics = (topics || []).map((item) => ({ ...item, parent_id: null, is_free_practice: false }));
    // ดึงมาทั้งหมดรวมที่ปิดใช้งาน เพราะต้องเดินขึ้นไปตรวจว่าหมวดหลักเหนือขึ้นไปยังเปิดอยู่ไหม
    const nestedResult = await supabase
      .from('content_topics')
      .select('id, legacy_id, subject_id, parent_id, name, description, sort_order, is_active, is_free_practice')
      .order('sort_order')
      .order('name');
    if (nestedResult.error && !isOptionalHierarchySchemaError(nestedResult.error)) throw nestedResult.error;
    if (!nestedResult.error) {
      const allTopics = nestedResult.data || [];
      const byId = new Map(allTopics.map((item) => [item.id, item]));
      const activeSubjectIds = new Set((subjects || []).map((item) => item.id));

      // หัวข้อจะใช้งานได้ก็ต่อเมื่อตัวเอง หมวดหลักทุกชั้นเหนือขึ้นไป และวิชาต้นสังกัด เปิดใช้งานครบ
      // ปิดหมวดหลักหนึ่งครั้งจึงซ่อนลูกหลานทั้งกิ่งให้อัตโนมัติ ไม่ต้องไล่ปิดทีละหัวข้อ
      const usable = (topic) => {
        if (!activeSubjectIds.has(topic.subject_id)) return false;
        let cursor = topic;
        for (let depth = 0; cursor && depth <= 10; depth += 1) {
          if (cursor.is_active === false) return false;
          if (!cursor.parent_id) return true;
          cursor = byId.get(cursor.parent_id);
          if (!cursor) return false; // หมวดหลักถูกลบไปแล้ว ถือว่าใช้ไม่ได้
        }
        return false;
      };

      nestedTopics = allTopics.filter(usable);
    }

    // แปลง topic_id (uuid) เป็น legacy_id เองจากรายการหัวข้อที่ดึงมาแล้ว แทนการ join ตอน query
    // ช่วยลดขนาดข้อมูลที่ต้องดึงข้ามหน้า และให้คีย์ตรงกับที่หน้าบ้านใช้อ้างอิงหัวข้อ
    const legacyById = new Map(nestedTopics.map((item) => [item.id, item.legacy_id || item.id]));
    const topicQuestionCounts = (questionTopics || []).reduce((counts, question) => {
      const key = legacyById.get(question.topic_id);
      if (key) counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});

    return NextResponse.json({
      isLoggedIn: Boolean(user),
      isMember: Boolean(access?.isMember),
      subjects: subjects || [],
      topics: nestedTopics,
      topicQuestionCounts,
      sets: (sets || []).map((item) => mapSet(item, access)).filter((item) => item.questionCount > 0),
    });
  } catch (error) {
    if (error?.code === '42P01') {
      return NextResponse.json({ isLoggedIn: false, isMember: false, subjects: [], topics: [], sets: [], source: 'unavailable' });
    }
    return NextResponse.json({ error: 'ไม่สามารถโหลดรายการข้อสอบได้' }, { status: 500 });
  }
}

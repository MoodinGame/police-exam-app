import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply';
const SUBSCRIBERS_TABLE = 'line_notification_subscribers';

function config(name) {
  return String(process.env[name] || '').trim();
}

function configuredRecipientIds() {
  // Production recipients must come from the verified LINE webhook subscription.
  // Environment recipients are useful only for controlled local tests.
  if (process.env.NODE_ENV === 'production') return [];
  return [...new Set(config('LINE_ADMIN_USER_IDS')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean))]
    .slice(0, 20);
}

function timingSafeMatch(value, expected) {
  const received = Buffer.from(String(value || ''));
  const target = Buffer.from(expected);
  return received.length === target.length && timingSafeEqual(received, target);
}

function paymentReviewUrl() {
  const appUrl = config('APP_URL').replace(/\/+$/, '');
  return appUrl ? `${appUrl}/admin/payments` : '';
}

function formatAmount(amount) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function formatTime(value) {
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(value || Date.now()));
}

function buildPaymentAlert({ planName, amount, createdAt, test = false }) {
  const heading = test ? '🔔 ทดสอบการแจ้งเตือน POLREADY' : '🔔 มีคำขอแพ็กเกจใหม่';
  const lines = [
    heading,
    `แพ็กเกจ: ${String(planName || 'สมาชิก').slice(0, 100)}`,
    `ยอดชำระ: ${formatAmount(amount)}`,
    test ? 'หากเห็นข้อความนี้ การแจ้งเตือนพร้อมใช้งาน' : `ส่งคำขอ: ${formatTime(createdAt)}`,
  ];
  const url = paymentReviewUrl();
  if (url) lines.push(`ตรวจสอบสลิป: ${url}`);
  return lines.join('\n');
}

function lineHeaders() {
  return {
    Authorization: `Bearer ${config('LINE_CHANNEL_ACCESS_TOKEN')}`,
    'Content-Type': 'application/json',
  };
}

async function sendLinePush(userId, text) {
  const response = await fetch(LINE_PUSH_URL, {
    method: 'POST',
    headers: { ...lineHeaders(), 'X-Line-Retry-Key': randomUUID() },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: 'text', text }],
      notificationDisabled: false,
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`LINE push failed (${response.status})${detail ? `: ${detail}` : ''}`);
  }
}

async function replyToLine(replyToken, text) {
  if (!replyToken || !config('LINE_CHANNEL_ACCESS_TOKEN')) return;
  try {
    await fetch(LINE_REPLY_URL, {
      method: 'POST',
      headers: lineHeaders(),
      body: JSON.stringify({ replyToken, messages: [{ type: 'text', text }] }),
      signal: AbortSignal.timeout(8_000),
    });
  } catch (error) {
    console.error('[line-notifications] Unable to reply to setup message', error);
  }
}

async function listSubscribers() {
  const configuredRecipients = configuredRecipientIds();
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(SUBSCRIBERS_TABLE)
      .select('line_user_id')
      .order('subscribed_at', { ascending: true })
      .limit(20);
    if (error) throw error;
    return [...new Set([
      ...configuredRecipients,
      ...(data || []).map((row) => row.line_user_id).filter(Boolean),
    ])].slice(0, 20);
  } catch (error) {
    if (!configuredRecipients.length) {
      console.error('[line-notifications] Unable to load notification recipients', error);
    }
    return configuredRecipients;
  }
}

export async function sendPendingPaymentNotification({ planName, amount, createdAt, test = false }) {
  if (!config('LINE_CHANNEL_ACCESS_TOKEN')) {
    return { configured: false, delivered: 0, reason: 'missing_access_token' };
  }

  const recipients = await listSubscribers();
  if (!recipients.length) {
    return { configured: false, delivered: 0, reason: 'no_subscribers' };
  }

  const text = buildPaymentAlert({ planName, amount, createdAt, test });
  const results = await Promise.allSettled(recipients.map((userId) => sendLinePush(userId, text)));
  const deliveredIds = recipients.filter((_, index) => results[index].status === 'fulfilled');
  const failed = results.filter((result) => result.status === 'rejected');

  if (deliveredIds.length) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from(SUBSCRIBERS_TABLE)
      .update({ last_notified_at: new Date().toISOString() })
      .in('line_user_id', deliveredIds);
    if (error) console.error('[line-notifications] Unable to record delivery time', error);
  }
  if (failed.length) {
    console.error('[line-notifications] Some LINE notifications were not delivered', failed.map((result) => result.reason));
  }

  return {
    configured: true,
    delivered: deliveredIds.length,
    failed: failed.length,
  };
}

export function verifyLineSignature(body, signature) {
  const secret = config('LINE_CHANNEL_SECRET');
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(body).digest('base64');
  return timingSafeMatch(signature, expected);
}

export async function processLineSubscriptionEvents(events) {
  const setupToken = config('LINE_ADMIN_SETUP_TOKEN');
  if (!setupToken) throw new Error('LINE_ADMIN_SETUP_TOKEN is not configured');

  const supabase = getSupabaseAdmin();
  let changes = 0;
  for (const event of events || []) {
    const userId = event?.source?.type === 'user' ? event.source.userId : '';
    const text = event?.type === 'message' && event?.message?.type === 'text' ? event.message.text.trim() : '';
    if (!userId || !text) continue;

    if (timingSafeMatch(text, `/subscribe ${setupToken}`)) {
      const { error } = await supabase
        .from(SUBSCRIBERS_TABLE)
        .upsert({ line_user_id: userId, subscribed_at: new Date().toISOString() }, { onConflict: 'line_user_id' });
      if (error) throw error;
      changes += 1;
      await replyToLine(event.replyToken, 'เปิดการแจ้งเตือนรายการชำระเงินของ POLREADY แล้ว');
    }

    if (timingSafeMatch(text, `/unsubscribe ${setupToken}`)) {
      const { error } = await supabase.from(SUBSCRIBERS_TABLE).delete().eq('line_user_id', userId);
      if (error) throw error;
      changes += 1;
      await replyToLine(event.replyToken, 'ปิดการแจ้งเตือนรายการชำระเงินของ POLREADY แล้ว');
    }
  }
  return changes;
}

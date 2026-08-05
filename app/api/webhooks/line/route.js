import { NextResponse } from 'next/server';
import { processLineSubscriptionEvents, verifyLineSignature } from '@/lib/lineAdminNotifications';

export const runtime = 'nodejs';

export async function POST(request) {
  const body = await request.text();
  if (!verifyLineSignature(body, request.headers.get('x-line-signature'))) {
    return NextResponse.json({ error: 'Invalid LINE signature' }, { status: 401 });
  }

  try {
    const payload = JSON.parse(body);
    await processLineSubscriptionEvents(payload.events);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[line-notifications] Unable to process LINE webhook', error);
    return NextResponse.json({ error: 'Unable to process LINE webhook' }, { status: 500 });
  }
}

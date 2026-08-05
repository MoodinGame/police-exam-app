import { NextResponse } from 'next/server';
import { AUTH_SESSION_COOKIE, OTP_CHALLENGE_COOKIE, secureCookieOptions } from '@/lib/otpServer';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Expire both authentication cookies with the same scope they were created
  // with, so the browser cannot restore an old OTP flow after sign-out.
  response.cookies.set(AUTH_SESSION_COOKIE, '', { ...secureCookieOptions, maxAge: 0 });
  response.cookies.set(OTP_CHALLENGE_COOKIE, '', { ...secureCookieOptions, maxAge: 0 });

  return response;
}

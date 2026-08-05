import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadLocalEnvironment() {
  const file = resolve(process.cwd(), '.env.local');
  if (!existsSync(file)) return;

  for (const rawLine of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    const [, key, rawValue] = match;
    const value = rawValue.trim().replace(/^(['"])(.*)\1$/, '$2');
    process.env[key] = value;
  }
}

loadLocalEnvironment();

// Next.js sets NODE_ENV=production for both Vercel Preview and Production
// builds. Keep the strict secret check for actual production releases, while
// allowing a preview deployment to build without live credentials.
const isProduction = process.env.VERCEL_ENV === 'production'
  || process.env.POLREADY_DEPLOY_TARGET === 'production'
  || (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV);
const errors = [];
const warnings = [];
const valueOf = (key) => String(process.env[key] || '').trim();
const looksPlaceholder = (value) => /replace-with|your-project|your-domain\.example/i.test(value);

function requireValue(key) {
  const value = valueOf(key);
  if (!value || looksPlaceholder(value)) errors.push(`${key} is missing or still uses a placeholder`);
  return value;
}

function validateUrl(key, { https = false } = {}) {
  const value = requireValue(key);
  if (!value) return;
  try {
    const url = new URL(value);
    if (https && url.protocol !== 'https:') errors.push(`${key} must use https in production`);
    if (isProduction && ['localhost', '127.0.0.1'].includes(url.hostname)) errors.push(`${key} cannot point to localhost in production`);
  } catch {
    errors.push(`${key} is not a valid URL`);
  }
}

if (isProduction) {
  validateUrl('NEXT_PUBLIC_SUPABASE_URL', { https: true });
  requireValue('SUPABASE_SECRET_KEY');
  requireValue('THSMS_API_TOKEN');
  requireValue('THSMS_SENDER');
  const otpSecret = requireValue('OTP_HMAC_SECRET');
  if (otpSecret && otpSecret.length < 32) errors.push('OTP_HMAC_SECRET must contain at least 32 characters');
  validateUrl('APP_URL', { https: true });

  ['LINE_CHANNEL_ACCESS_TOKEN', 'LINE_CHANNEL_SECRET', 'LINE_ADMIN_SETUP_TOKEN'].forEach(requireValue);
  if (valueOf('OTP_DEV_MODE') === 'true') errors.push('OTP_DEV_MODE must not be true in production');
  if (valueOf('LINE_ADMIN_USER_IDS')) errors.push('LINE_ADMIN_USER_IDS is local-only; use verified LINE subscribers in production');
} else {
  if (valueOf('OTP_DEV_MODE') === 'true') warnings.push('OTP development mode is enabled (safe only outside production)');
  if (!valueOf('LINE_CHANNEL_ACCESS_TOKEN')) warnings.push('LINE notifications are not configured for this local build');
}

if (errors.length) {
  console.error('Production preflight failed:');
  errors.forEach((message) => console.error(`- ${message}`));
  process.exitCode = 1;
} else {
  console.log(isProduction ? 'Production preflight passed.' : 'Local preflight passed (production-only checks skipped).');
}

warnings.forEach((message) => console.warn(`Warning: ${message}`));

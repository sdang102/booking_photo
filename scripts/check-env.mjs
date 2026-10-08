import process from 'node:process';
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;

const isProduction = process.argv.includes('--production') || process.env.NODE_ENV === 'production';

loadEnvConfig(process.cwd(), !isProduction);

const requiredVariables = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];
const missingVariables = requiredVariables.filter((name) => !process.env[name]?.trim());
const demoBookingsEnabled =
  process.env.NEXT_PUBLIC_USE_DEMO_BOOKINGS?.trim().toLowerCase() === 'true';

const errors = [];
if (missingVariables.length > 0) {
  errors.push(`Thiếu biến môi trường bắt buộc: ${missingVariables.join(', ')}.`);
}
if (isProduction && demoBookingsEnabled) {
  errors.push('NEXT_PUBLIC_USE_DEMO_BOOKINGS phải tắt trong production.');
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[check:env] ${error}`);
  process.exit(1);
}

console.log(`[check:env] Cấu hình ${isProduction ? 'production' : 'development'} hợp lệ.`);

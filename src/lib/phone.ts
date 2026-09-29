const VIETNAMESE_MOBILE_PATTERN = /^0(?:3|5|7|8|9)\d{8}$/;
const ALLOWED_PHONE_CHARACTERS = /^\+?[\d\s().-]+$/;

/**
 * Converts a Vietnamese mobile number to its canonical 10-digit 0-prefix form.
 * Common separators and the +84 country code are accepted.
 */
export function normalizeVietnameseMobile(value: string): string | null {
  const input = value.trim();
  if (!input || !ALLOWED_PHONE_CHARACTERS.test(input)) return null;

  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length === 11) {
    digits = `0${digits.slice(2)}`;
  }

  return VIETNAMESE_MOBILE_PATTERN.test(digits) ? digits : null;
}

export function isValidVietnameseMobile(value: string): boolean {
  return normalizeVietnameseMobile(value) !== null;
}

export const VIETNAMESE_MOBILE_ERROR =
  'Số điện thoại không hợp lệ. Hãy nhập số di động Việt Nam gồm 10 chữ số, ví dụ 0912345678.';

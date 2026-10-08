type ErrorContextValue = string | number | boolean | null | undefined;

export interface ErrorContext {
  area: string;
  operation: string;
  [key: string]: ErrorContextValue;
}

interface NormalizedError {
  name: string;
  message: string;
  code?: string;
  status?: number;
}

function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    const value = error as Error & { code?: unknown; status?: unknown; statusCode?: unknown };
    const rawStatus = value.status ?? value.statusCode;
    return {
      name: error.name || 'Error',
      message: error.message || 'Unknown error',
      code: typeof value.code === 'string' ? value.code : undefined,
      status: typeof rawStatus === 'number' ? rawStatus : Number(rawStatus) || undefined,
    };
  }

  if (error && typeof error === 'object') {
    const value = error as { name?: unknown; message?: unknown; code?: unknown; status?: unknown; statusCode?: unknown };
    const rawStatus = value.status ?? value.statusCode;
    return {
      name: typeof value.name === 'string' ? value.name : 'Error',
      message: typeof value.message === 'string' ? value.message : 'Unknown error',
      code: typeof value.code === 'string' ? value.code : undefined,
      status: typeof rawStatus === 'number' ? rawStatus : Number(rawStatus) || undefined,
    };
  }

  return { name: 'Error', message: typeof error === 'string' ? error : 'Unknown error' };
}

/**
 * Central error boundary for services. It intentionally records only a small,
 * structured diagnostic in development so PII, credentials and payloads do not
 * leak into logs. A production monitoring adapter can be connected here later.
 */
export function reportError(error: unknown, context: ErrorContext): void {
  if (process.env.NODE_ENV === 'production') return;
  const normalized = normalizeError(error);
  console.error('[app-error]', {
    ...context,
    name: normalized.name,
    message: normalized.message,
    code: normalized.code,
    status: normalized.status,
  });
}

export function userErrorMessage(error: unknown, fallback: string): string {
  const normalized = normalizeError(error);
  const value = normalized.message.toLowerCase();

  if (normalized.status === 429 || normalized.code === 'over_request_rate_limit' || value.includes('rate limit')) {
    return 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi một lúc rồi thử lại.';
  }
  if (normalized.status === 401 || value.includes('jwt') || value.includes('authentication required')) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }
  if (normalized.status === 403 || normalized.code === '42501' || /permission|policy|not authorized|forbidden/.test(value)) {
    return 'Bạn không có quyền thực hiện thao tác này.';
  }
  if (normalized.code === '23505' || value.includes('duplicate')) {
    return 'Thông tin này đã tồn tại. Vui lòng kiểm tra lại.';
  }
  if (['23P01', '23514', 'P0001'].includes(normalized.code ?? '') || /overlap|unavailable|working hours/.test(value)) {
    return 'Khung giờ vừa thay đổi hoặc không còn khả dụng. Vui lòng chọn lại.';
  }
  if (/failed to fetch|network|load failed|fetch failed/.test(value)) {
    return 'Không thể kết nối dịch vụ. Vui lòng kiểm tra mạng và thử lại.';
  }
  return fallback;
}

export function adminErrorMessage(error: unknown, fallback: string): string {
  const normalized = normalizeError(error);
  const code = normalized.code || normalized.status;
  return code ? `${fallback} (mã ${code})` : fallback;
}

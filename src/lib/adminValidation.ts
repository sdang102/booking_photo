type AdminPayload = Record<string, unknown>;

const NON_NEGATIVE_FIELDS = new Set([
  'price', 'travel_fee', 'default_deposit', 'display_order',
  'edited_photo_count', 'location_count', 'outfit_count',
]);

export function validateAdminPayload(table: string, payload: AdminPayload): string | null {
  for (const key of NON_NEGATIVE_FIELDS) {
    if (payload[key] === undefined || payload[key] === null || payload[key] === '') continue;
    const value = Number(payload[key]);
    if (!Number.isFinite(value) || value < 0) return `${fieldLabel(key)} phải là số không âm.`;
  }

  if (payload.duration_minutes !== undefined) {
    const duration = Number(payload.duration_minutes);
    if (!Number.isFinite(duration) || duration <= 0) return 'Thời lượng phải là số lớn hơn 0.';
  }

  if (typeof payload.slug === 'string' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) {
    return 'Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang; không bắt đầu hoặc kết thúc bằng dấu gạch.';
  }

  if (table === 'site_settings' && typeof payload.email === 'string' && payload.email && !/^\S+@\S+\.\S+$/.test(payload.email)) {
    return 'Email liên hệ không hợp lệ.';
  }

  for (const [key, rawValue] of Object.entries(payload)) {
    if (!key.endsWith('_url') || !rawValue) continue;
    try {
      const url = new URL(String(rawValue));
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('unsupported protocol');
    } catch { return `${fieldLabel(key)} phải là URL bắt đầu bằng http:// hoặc https://.`; }
  }
  return null;
}

function fieldLabel(key: string) {
  const labels: Record<string, string> = {
    price: 'Giá', travel_fee: 'Phụ phí', default_deposit: 'Tiền cọc', display_order: 'Thứ tự',
    edited_photo_count: 'Số ảnh hoàn thiện', location_count: 'Số địa điểm', outfit_count: 'Số trang phục',
    logo_url: 'Logo', favicon_url: 'Favicon', og_image_url: 'Ảnh chia sẻ', facebook_url: 'Facebook',
    instagram_url: 'Instagram', tiktok_url: 'TikTok', threads_url: 'Threads',
  };
  return labels[key] ?? key;
}

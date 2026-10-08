import type { Service } from '@/types';

type ServiceRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  price: number | string;
  duration_minutes: number;
  features?: unknown;
  cover_image?: string | null;
  is_featured?: boolean | null;
  edited_photo_count?: number | null;
  concept_count?: number | null;
  location_count?: number | null;
};

export const LEGACY_SERVICE_SLUGS = [
  'wedding-pre-wedding',
  'business-portrait',
  'vintage-concept',
  'family-memories',
  'event-celebration',
];

const LEGACY_PACKAGE_INDEX: Record<string, number> = {
  'wedding-pre-wedding': 0,
  'business-portrait': 0,
  'vintage-concept': 1,
  'family-memories': 2,
};

export const FIN_PACKAGES = [
  {
    title: 'The Essential', slug: 'essential', tier: 'Entry',
    description: 'Một chút sang trọng trong những khoảnh khắc thường ngày.',
    price: 699000, duration: 45, locations: 1, outfits: 1, photos: 8,
    consultation: 'Cơ bản', featured: false,
    features: ['1 địa điểm', '1 outfit', '8 ảnh chỉnh màu và retouch', 'Hướng dẫn tạo dáng xuyên suốt', 'Phù hợp chụp cafe, street style, OOTD cá nhân'],
  },
  {
    title: 'The Signature', slug: 'signature', tier: 'Signature',
    description: 'Câu chuyện cá nhân qua từng khung hình.',
    price: 1199000, duration: 90, locations: 2, outfits: 2, photos: 18,
    consultation: 'Cá nhân hóa', featured: true,
    features: ['Tối đa 2 địa điểm gần nhau', '2 outfits', '18 ảnh chỉnh màu và retouch', 'Hướng dẫn tạo dáng xuyên suốt', 'Phù hợp lookbook cá nhân, Instagram, lifestyle editorial'],
  },
  {
    title: 'The Editorial', slug: 'editorial', tier: 'Premium',
    description: 'Một bộ ảnh mang dấu ấn thời trang và điện ảnh.',
    price: 1899000, duration: 150, locations: 3, outfits: 3, photos: 30,
    consultation: 'Chuyên sâu', featured: false,
    features: ['Tối đa 3 địa điểm gần nhau', '3 outfits', '30 ảnh chỉnh màu và retouch', 'Hướng dẫn tạo dáng xuyên suốt', 'Phù hợp xây dựng hình ảnh cá nhân, fashion editorial, luxury lifestyle'],
  },
] as const;

function stringFeatures(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : [];
}

function numberFromFeatures(features: string[], pattern: RegExp, fallback: number) {
  const match = features.join(' ').match(pattern);
  return match ? Number(match[1]) : fallback;
}

export function mapServiceRow(row: ServiceRow, index: number, category = 'portrait', imageUrl = row.cover_image ?? ''): Service | null {
  const legacy = LEGACY_SERVICE_SLUGS.includes(String(row.slug));
  const preset = legacy ? FIN_PACKAGES[LEGACY_PACKAGE_INDEX[String(row.slug)] ?? index] : undefined;
  if (legacy && !preset) return null;

  const features = preset ? [...preset.features] : stringFeatures(row.features);
  const locations = preset?.locations ?? (Number(row.location_count) || 1);
  const outfits = preset?.outfits ?? numberFromFeatures(features, /(\d+)\s*outfits?/i, 1);
  const photos = preset?.photos ?? (Number(row.edited_photo_count) || numberFromFeatures(features, /(\d+)\s*ảnh/i, 15));

  return {
    id: String(row.id),
    title: preset?.title ?? String(row.name),
    slug: preset?.slug ?? String(row.slug),
    category: category as Service['category'],
    description: preset?.description ?? row.description ?? row.short_description ?? '',
    price: preset?.price ?? Number(row.price),
    duration_minutes: preset?.duration ?? Number(row.duration_minutes),
    features,
    image_url: imageUrl,
    is_popular: preset?.featured ?? Boolean(row.is_featured),
    edited_photos: photos,
    concept_count: row.concept_count ?? undefined,
    location_count: String(locations),
    outfit_count: outfits,
    consultation_level: preset?.consultation ?? (index === 0 ? 'Cơ bản' : index === 1 ? 'Cá nhân hóa' : 'Chuyên sâu'),
    tier_label: preset?.tier,
  };
}

export function getCatalogFallbackServices(): Service[] {
  return FIN_PACKAGES.map((preset, index) => ({
    id: `fin-package-${index + 1}`,
    title: preset.title,
    slug: preset.slug,
    category: 'portrait',
    description: preset.description,
    price: preset.price,
    duration_minutes: preset.duration,
    features: [...preset.features],
    image_url: '/fin-hero-bg.jpg',
    is_popular: preset.featured,
    edited_photos: preset.photos,
    concept_count: preset.locations,
    location_count: String(preset.locations),
    outfit_count: preset.outfits,
    consultation_level: preset.consultation,
    tier_label: preset.tier,
  }));
}

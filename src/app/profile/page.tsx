'use client';

/* eslint-disable @next/next/no-img-element -- avatar editor needs a local object URL for crop/drag preview. */

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type PointerEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { CalendarCheck2, KeyRound, Mail, Pencil, Phone, Save, UserRound } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import BrandLogo from '@/components/BrandLogo';
import { DEFAULT_AVATAR_URL } from '@/lib/avatar';
import { useAuth } from '@/lib/context/AuthContext';
import { getUserBookings } from '@/lib/services/bookingService';
import LogoutButton from '@/components/LogoutButton';

export default function Profile() {
  const { user, updateProfile, updateAvatar, changePassword } = useAuth();
  const [activeBookings, setActiveBookings] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [section, setSection] = useState<'personal' | 'security' | 'bookings'>('personal');
  const [crop, setCrop] = useState<{ file: File; url: string } | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const cropDrag = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserBookings(user.id, user.email, { activeOnly: true }).then((items) => setActiveBookings(items.length));
  }, [user]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setMessage(null);
    const result = await updateProfile(String(data.get('fullName') || ''), String(data.get('phone') || ''));
    setSaving(false);
    setMessage({ type: result.success ? 'success' : 'error', text: result.message || 'Không thể cập nhật hồ sơ.' });
  };

  const handleAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setAvatarMessage('Vui lòng chọn file ảnh.'); return; }
    setAvatarMessage(null);
    setCrop({ file, url: URL.createObjectURL(file) });
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (!crop) return;
    const previous = { bodyOverflow: document.body.style.overflow, bodyTouchAction: document.body.style.touchAction, htmlOverflow: document.documentElement.style.overflow };
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous.bodyOverflow; document.body.style.touchAction = previous.bodyTouchAction; document.documentElement.style.overflow = previous.htmlOverflow; };
  }, [crop]);

  const cancelCrop = () => {
    if (crop) URL.revokeObjectURL(crop.url);
    setCrop(null);
  };

  const applyAvatarCrop = async () => {
    if (!crop || avatarBusy) return;
    setAvatarBusy(true); setAvatarMessage(null);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new window.Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error('Không thể đọc ảnh đã chọn.'));
        element.src = crop.url;
      });
      const cropSize = Math.min(image.naturalWidth, image.naturalHeight) / cropZoom;
      const sourceX = Math.max(0, Math.min(image.naturalWidth - cropSize, (image.naturalWidth - cropSize) / 2 - cropOffset.x * (cropSize / 320)));
      const sourceY = Math.max(0, Math.min(image.naturalHeight - cropSize, (image.naturalHeight - cropSize) / 2 - cropOffset.y * (cropSize / 320)));
      const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Trình duyệt không hỗ trợ cắt ảnh.');
      context.drawImage(image, sourceX, sourceY, cropSize, cropSize, 0, 0, 512, 512);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Không thể tạo ảnh đại diện.')), 'image/webp', .86));
      const result = await updateAvatar(new File([blob], `${crop.file.name.replace(/\.[^.]+$/, '')}-avatar.webp`, { type: 'image/webp' }));
      setAvatarMessage(result.message || (result.success ? 'Đã cập nhật ảnh đại diện.' : 'Không thể đổi ảnh đại diện.'));
      if (result.success) cancelCrop();
    } catch (error) {
      setAvatarMessage(error instanceof Error ? error.message : 'Không thể cắt ảnh.');
    } finally { setAvatarBusy(false); }
  };

  const startCropDrag = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    cropDrag.current = { startX: event.clientX, startY: event.clientY, originX: cropOffset.x, originY: cropOffset.y };
  };
  const moveCropDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = cropDrag.current;
    if (!drag) return;
    setCropOffset({ x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY });
  };
  const stopCropDrag = () => { cropDrag.current = null; };

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordBusy) return;
    const data = new FormData(event.currentTarget);
    const current = String(data.get('currentPassword') || '');
    const next = String(data.get('newPassword') || '');
    const confirm = String(data.get('confirmPassword') || '');
    setPasswordMessage(null);
    if (next !== confirm) { setPasswordMessage({ type: 'error', text: 'Mật khẩu mới nhập lại chưa khớp.' }); return; }
    setPasswordBusy(true);
    const result = await changePassword(current, next);
    setPasswordBusy(false);
    setPasswordMessage({ type: result.success ? 'success' : 'error', text: result.message || 'Không thể đổi mật khẩu.' });
    if (result.success) event.currentTarget.reset();
  };

  const backHref = user?.roles.includes('admin') ? '/admin' : user?.roles.includes('photographer') ? '/photographer' : '/';

  return <RoleGuard allow={['user', 'photographer', 'admin']}>
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <header className="mx-auto flex max-w-3xl items-center justify-between">
        <Link href={backHref} className="text-sm font-bold text-sky-800">← Quay lại</Link>
        <BrandLogo compact />
      </header>
      <section className="mx-auto mt-8 max-w-xl rounded-3xl border border-sky-200 bg-elevated p-5 sm:mt-10 sm:p-8">
        <p className="section-kicker">Tài khoản</p>
        <h1 className="mt-2 text-3xl font-black">Hồ sơ của bạn</h1>

        <div className="profile-avatar-editor mt-6">
          <div className="profile-avatar-editor__image">
            <img src={user?.avatar_url || DEFAULT_AVATAR_URL} alt="Ảnh đại diện" width="160" height="160" loading="lazy" decoding="async" />
            <label className="profile-avatar-editor__pencil" title="Đổi ảnh đại diện">
              <Pencil aria-hidden="true" />
              <input type="file" accept="image/*" onChange={handleAvatar} disabled={avatarBusy} />
            </label>
          </div>
          {avatarMessage && <small className="profile-avatar-editor__message">{avatarMessage}</small>}
        </div>

        <div className="profile-section-tabs mt-7" role="tablist" aria-label="Mục quản lý tài khoản">
          <button type="button" className={section === 'personal' ? 'is-active' : ''} onClick={() => setSection('personal')}>Thông tin cá nhân</button>
          <button type="button" className={section === 'security' ? 'is-active' : ''} onClick={() => setSection('security')}>Bảo mật</button>
          <button type="button" className={section === 'bookings' ? 'is-active' : ''} onClick={() => setSection('bookings')}>Lịch đã đặt</button>
        </div>

        {section === 'bookings' && <Link href="/my-bookings" className="relative mt-5 flex items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 transition hover:-translate-y-0.5 hover:shadow-lg">
          <span className="booking-notification-pulse grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-brand-contrast"><CalendarCheck2 className="h-5 w-5" /></span>
          <span><strong className="block">Lịch đã đặt & trạng thái đơn</strong><span className="mt-1 block text-xs text-red-700">Theo dõi tiến trình booking của bạn.</span></span>
          {activeBookings > 0 && <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-brand px-1 text-[10px] font-black text-brand-contrast ring-2 ring-elevated">{activeBookings > 9 ? '9+' : activeBookings}<span className="sr-only"> lịch đang hoạt động</span></span>}
        </Link>}

        {section === 'personal' && <form onSubmit={save} className="mt-5 space-y-4">
          {message && <p role="status" className={`rounded-xl border p-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{message.text}</p>}
          <ProfileField label="Họ và tên" icon={<UserRound />}><input required name="fullName" defaultValue={user?.full_name || ''} autoComplete="name" className="booking-input booking-input-icon" /></ProfileField>
          <ProfileField label="Email đăng nhập (không thể thay đổi)" icon={<Mail />}><input readOnly name="email" type="email" value={user?.email || ''} autoComplete="email" className="booking-input booking-input-icon profile-readonly" /></ProfileField>
          <ProfileField label="Số điện thoại" icon={<Phone />}><input required name="phone" type="tel" inputMode="tel" defaultValue={user?.phone || ''} autoComplete="tel" placeholder="0912 345 678" className="booking-input booking-input-icon" /></ProfileField>
          <p className="text-xs leading-5 text-slate-500">Email được dùng để đăng nhập và hiện chưa hỗ trợ thay đổi.</p>
          <button type="submit" disabled={saving} className="sky-button flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 font-bold disabled:cursor-wait disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
        </form>}

        {section === 'security' && <form onSubmit={savePassword} className="mt-5 space-y-4 border-t border-sky-200 pt-6">
          <div><h2 className="flex items-center gap-2 text-lg font-black"><KeyRound className="h-5 w-5 text-sky-600" />Đổi mật khẩu</h2><p className="mt-1 text-xs text-slate-500">Nhập mật khẩu hiện tại và mật khẩu mới tối thiểu 8 ký tự.</p></div>
          {passwordMessage && <p role="status" className={`rounded-xl border p-3 text-sm ${passwordMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{passwordMessage.text}</p>}
          <input required name="currentPassword" type="password" minLength={8} autoComplete="current-password" placeholder="Mật khẩu hiện tại" className="booking-input" />
          <input required name="newPassword" type="password" minLength={8} autoComplete="new-password" placeholder="Mật khẩu mới" className="booking-input" />
          <input required name="confirmPassword" type="password" minLength={8} autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" className="booking-input" />
          <div className="flex items-center justify-between gap-3"><Link href="/forgot-password" className="text-xs font-semibold text-sky-700 underline-offset-4 hover:underline">Quên mật khẩu?</Link><button type="submit" disabled={passwordBusy} className="sky-button flex min-h-11 items-center gap-2 rounded-xl px-4 font-bold disabled:opacity-60"><KeyRound className="h-4 w-4" />{passwordBusy ? 'Đang đổi...' : 'Đổi mật khẩu'}</button></div>
        </form>}

        <div className="mt-7 space-y-3">
          {user?.roles.includes('admin') && <Link href="/admin" className="sky-button block rounded-xl px-4 py-3 text-center text-sm">Mở trang quản trị</Link>}
          {user?.roles.includes('photographer') && <Link href="/photographer" className="sky-button block rounded-xl px-4 py-3 text-center text-sm">Mở workspace thợ chụp</Link>}
          <div className="border-t border-sky-200 pt-4">
            <LogoutButton label="Đăng xuất" className="min-h-12 w-full rounded-xl border-rose-200 text-rose-700" />
          </div>
        </div>
      </section>
      {crop && <div className="avatar-crop-backdrop" role="presentation"><section className="avatar-crop-dialog" role="dialog" aria-modal="true" aria-labelledby="avatar-crop-title"><h2 id="avatar-crop-title">Cắt ảnh đại diện</h2><div className="avatar-crop-preview" onPointerDown={startCropDrag} onPointerMove={moveCropDrag} onPointerUp={stopCropDrag} onPointerCancel={stopCropDrag}><img src={crop.url} alt="Xem trước ảnh đại diện" width="512" height="512" decoding="async" style={{ transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom})` }} /></div><p className="avatar-crop-hint">Kéo ảnh để căn trái, phải, lên hoặc xuống.</p><label className="avatar-crop-zoom">Thu phóng <input type="range" min="1" max="2.5" step=".05" value={cropZoom} onChange={(event) => setCropZoom(Number(event.target.value))} /></label><div className="avatar-crop-actions"><button type="button" onClick={cancelCrop}>Hủy</button><button type="button" onClick={() => { void applyAvatarCrop(); }} disabled={avatarBusy}>{avatarBusy ? 'Đang lưu...' : 'Dùng ảnh này'}</button></div></section></div>}
    </main>
  </RoleGuard>;
}

function ProfileField({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return <label className="block text-sm font-bold text-slate-700">
    <span className="mb-2 block">{label}</span>
    <span className="relative block"><span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-sky-600 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>{children}</span>
  </label>;
}

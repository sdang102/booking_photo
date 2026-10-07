'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { CalendarCheck2, KeyRound, Mail, Pencil, Phone, Save, UserRound } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import BrandLogo from '@/components/BrandLogo';
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

  useEffect(() => {
    if (!user) return;
    getUserBookings(user.id, user.email, { activeOnly: true }).then((items) => setActiveBookings(items.length));
  }, [user]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    setAvatarBusy(true); setAvatarMessage(null);
    const result = await updateAvatar(file);
    setAvatarBusy(false); setAvatarMessage(result.message || (result.success ? 'Đã cập nhật ảnh đại diện.' : 'Không thể đổi ảnh đại diện.'));
  };

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
            {user?.avatar_url ? <img src={user.avatar_url} alt="Ảnh đại diện" /> : <UserRound aria-hidden="true" />}
            <label className="profile-avatar-editor__pencil" title="Đổi ảnh đại diện">
              <Pencil aria-hidden="true" />
              <input type="file" accept="image/*" onChange={handleAvatar} disabled={avatarBusy} />
            </label>
          </div>
          <div><strong>Ảnh đại diện</strong><p>Ảnh vuông, tối đa 20MB. {avatarBusy ? 'Đang tải lên...' : 'Bấm biểu tượng bút để thay đổi.'}</p>{avatarMessage && <small className="profile-avatar-editor__message">{avatarMessage}</small>}</div>
        </div>

        <Link href="/my-bookings" className="relative mt-6 flex items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 transition hover:-translate-y-0.5 hover:shadow-lg">
          <span className="booking-notification-pulse grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-brand-contrast"><CalendarCheck2 className="h-5 w-5" /></span>
          <span><strong className="block">Lịch đã đặt & trạng thái đơn</strong><span className="mt-1 block text-xs text-red-700">Theo dõi tiến trình booking của bạn.</span></span>
          {activeBookings > 0 && <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-brand px-1 text-[10px] font-black text-brand-contrast ring-2 ring-elevated">{activeBookings > 9 ? '9+' : activeBookings}<span className="sr-only"> lịch đang hoạt động</span></span>}
        </Link>

        <form onSubmit={save} className="mt-7 space-y-4">
          {message && <p role="status" className={`rounded-xl border p-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{message.text}</p>}
          <ProfileField label="Họ và tên" icon={<UserRound />}><input required name="fullName" defaultValue={user?.full_name || ''} autoComplete="name" className="booking-input booking-input-icon" /></ProfileField>
          <ProfileField label="Email đăng nhập (không thể thay đổi)" icon={<Mail />}><input readOnly name="email" type="email" value={user?.email || ''} autoComplete="email" className="booking-input booking-input-icon profile-readonly" /></ProfileField>
          <ProfileField label="Số điện thoại" icon={<Phone />}><input required name="phone" type="tel" inputMode="tel" defaultValue={user?.phone || ''} autoComplete="tel" placeholder="0912 345 678" className="booking-input booking-input-icon" /></ProfileField>
          <p className="text-xs leading-5 text-slate-500">Email được dùng để đăng nhập và hiện chưa hỗ trợ thay đổi.</p>
          <button type="submit" disabled={saving} className="sky-button flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 font-bold disabled:cursor-wait disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
        </form>

        <form onSubmit={savePassword} className="mt-8 space-y-4 border-t border-sky-200 pt-6">
          <div><h2 className="flex items-center gap-2 text-lg font-black"><KeyRound className="h-5 w-5 text-sky-600" />Đổi mật khẩu</h2><p className="mt-1 text-xs text-slate-500">Nhập mật khẩu hiện tại và mật khẩu mới tối thiểu 8 ký tự.</p></div>
          {passwordMessage && <p role="status" className={`rounded-xl border p-3 text-sm ${passwordMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{passwordMessage.text}</p>}
          <input required name="currentPassword" type="password" minLength={8} autoComplete="current-password" placeholder="Mật khẩu hiện tại" className="booking-input" />
          <input required name="newPassword" type="password" minLength={8} autoComplete="new-password" placeholder="Mật khẩu mới" className="booking-input" />
          <input required name="confirmPassword" type="password" minLength={8} autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" className="booking-input" />
          <div className="flex items-center justify-between gap-3"><button type="button" disabled className="text-xs font-semibold text-slate-400">Quên mật khẩu? (sắp có)</button><button type="submit" disabled={passwordBusy} className="sky-button flex min-h-11 items-center gap-2 rounded-xl px-4 font-bold disabled:opacity-60"><KeyRound className="h-4 w-4" />{passwordBusy ? 'Đang đổi...' : 'Đổi mật khẩu'}</button></div>
        </form>

        <div className="mt-7 space-y-3">
          {user?.roles.includes('admin') && <Link href="/admin" className="sky-button block rounded-xl px-4 py-3 text-center text-sm">Mở trang quản trị</Link>}
          {user?.roles.includes('photographer') && <Link href="/photographer" className="sky-button block rounded-xl px-4 py-3 text-center text-sm">Mở workspace thợ chụp</Link>}
          <div className="border-t border-sky-200 pt-4">
            <LogoutButton label="Đăng xuất" className="min-h-12 w-full rounded-xl border-rose-200 text-rose-700" />
          </div>
        </div>
      </section>
    </main>
  </RoleGuard>;
}

function ProfileField({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return <label className="block text-sm font-bold text-slate-700">
    <span className="mb-2 block">{label}</span>
    <span className="relative block"><span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-sky-600 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>{children}</span>
  </label>;
}

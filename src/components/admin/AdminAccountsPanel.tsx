'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Ban, CheckCircle2, Pencil, Plus, Search, Trash2, UserRoundCheck, X } from 'lucide-react';
import { ACCOUNT_ROLE_LABELS, ACCOUNT_ROLES, type AccountFormValues, type AdminAccount } from '@/lib/adminAccounts';
import type { AppRole } from '@/types';

type AccountResponse = { accounts: AdminAccount[]; currentUserId: string };
type Message = { kind: 'success' | 'error'; text: string } | null;
type FilterRole = AppRole | 'all';

const EMPTY_FORM: AccountFormValues = { email: '', fullName: '', phone: '', roles: ['user'], password: '' };

export default function AdminAccountsPanel() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<FilterRole>('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [form, setForm] = useState<AccountFormValues | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/accounts', { cache: 'no-store' });
      const payload = await readPayload<AccountResponse>(response);
      setAccounts(payload.accounts);
      setCurrentUserId(payload.currentUserId);
    } catch (error) {
      setMessage({ kind: 'error', text: getErrorMessage(error) });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('vi');
    return accounts.filter((account) => {
      const matchesRole = role === 'all' || account.roles.includes(role);
      const matchesQuery = !keyword || `${account.fullName} ${account.email} ${account.phone}`.toLocaleLowerCase('vi').includes(keyword);
      return matchesRole && matchesQuery;
    });
  }, [accounts, query, role]);

  const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM, roles: [...EMPTY_FORM.roles] }); setMessage(null); };
  const openEdit = (account: AdminAccount) => {
    setEditingId(account.id);
    setForm({ email: account.email, fullName: account.fullName, phone: account.phone, roles: [...account.roles] });
    setMessage(null);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setBusyId(editingId || 'create');
    setMessage(null);
    try {
      const response = await fetch('/api/admin/accounts', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...form, password: undefined } : form),
      });
      const payload = await readPayload<{ message: string }>(response);
      setForm(null);
      setEditingId(null);
      await load();
      setMessage({ kind: 'success', text: payload.message });
    } catch (error) { setMessage({ kind: 'error', text: getErrorMessage(error) }); }
    finally { setBusyId(''); }
  };

  const toggleDisabled = async (account: AdminAccount) => {
    const action = account.disabled ? 'kích hoạt lại' : 'vô hiệu hóa';
    if (!window.confirm(`Bạn chắc chắn muốn ${action} tài khoản ${account.email}?`)) return;
    setBusyId(account.id);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: account.id, disabled: !account.disabled }),
      });
      const payload = await readPayload<{ message: string }>(response);
      await load();
      setMessage({ kind: 'success', text: payload.message });
    } catch (error) { setMessage({ kind: 'error', text: getErrorMessage(error) }); }
    finally { setBusyId(''); }
  };

  const remove = async (account: AdminAccount) => {
    if (!window.confirm(`Xóa vĩnh viễn tài khoản ${account.email}? Booking và đánh giá sẽ được giữ lại nhưng không còn gắn với tài khoản này.`)) return;
    setBusyId(account.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/accounts?id=${encodeURIComponent(account.id)}`, { method: 'DELETE' });
      const payload = await readPayload<{ message: string }>(response);
      await load();
      setMessage({ kind: 'success', text: payload.message });
    } catch (error) { setMessage({ kind: 'error', text: getErrorMessage(error) }); }
    finally { setBusyId(''); }
  };

  const counts = ACCOUNT_ROLES.map((item) => ({ role: item, count: accounts.filter((account) => account.roles.includes(item)).length }));

  return <>
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="grid flex-1 gap-3 sm:grid-cols-3">
        {counts.map((item) => <div key={item.role} className="rounded-2xl border border-sky-200 bg-white p-4"><p className="text-xs text-slate-500">{ACCOUNT_ROLE_LABELS[item.role]}</p><strong className="mt-1 block text-2xl">{item.count}</strong></div>)}
      </div>
      <button type="button" onClick={openCreate} className="sky-button flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-5"><Plus className="h-4 w-4" />Thêm tài khoản</button>
    </div>

    {message && <div role="alert" className={`mt-5 rounded-xl border p-4 text-sm ${message.kind === 'error' ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}`}>{message.text}</div>}

    <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_240px]">
      <label className="relative"><span className="sr-only">Tìm tài khoản</span><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="booking-input pl-10" placeholder="Tìm tên, email, số điện thoại…" /></label>
      <select aria-label="Lọc theo vai trò" className="booking-input" value={role} onChange={(event) => setRole(event.target.value as FilterRole)}><option value="all">Tất cả vai trò</option>{ACCOUNT_ROLES.map((item) => <option key={item} value={item}>{ACCOUNT_ROLE_LABELS[item]}</option>)}</select>
    </div>

    {loading ? <div className="mt-6 rounded-2xl border border-sky-200 bg-white p-8 text-center text-sm text-slate-500">Đang tải tài khoản…</div> :
      <div className="mt-6 overflow-x-auto rounded-2xl border border-sky-200 bg-white"><table className="w-full min-w-[960px] text-left text-sm"><thead><tr><th className="p-4">Tài khoản</th><th className="p-4">Vai trò</th><th className="p-4">Trạng thái</th><th className="p-4">Đăng nhập gần nhất</th><th className="p-4 text-right">Thao tác</th></tr></thead><tbody>{filtered.map((account) => {
        const ownAccount = account.id === currentUserId;
        return <tr key={account.id}><td className="p-4"><strong className="block">{account.fullName || 'Chưa cập nhật tên'}{ownAccount && <span className="ml-2 text-xs font-normal text-sky-600">(Bạn)</span>}</strong><span className="mt-1 block text-xs text-slate-500">{account.email}{account.phone ? ` · ${account.phone}` : ''}</span></td><td className="p-4"><div className="flex flex-wrap gap-1.5">{account.roles.map((item) => <span key={item} className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">{ACCOUNT_ROLE_LABELS[item]}</span>)}</div></td><td className="p-4">{account.disabled ? <span className="inline-flex items-center gap-1.5 text-rose-700"><Ban className="h-4 w-4" />Đã vô hiệu hóa</span> : <span className="inline-flex items-center gap-1.5 text-emerald-700"><CheckCircle2 className="h-4 w-4" />Đang hoạt động</span>}</td><td className="p-4 text-xs text-slate-500">{formatDate(account.lastSignInAt)}</td><td className="p-4"><div className="flex justify-end gap-2"><ActionButton label="Sửa" icon={<Pencil />} disabled={busyId === account.id} onClick={() => openEdit(account)} /><ActionButton label={account.disabled ? 'Kích hoạt' : 'Vô hiệu hóa'} icon={account.disabled ? <UserRoundCheck /> : <Ban />} disabled={busyId === account.id || ownAccount} onClick={() => void toggleDisabled(account)} /><ActionButton danger label="Xóa" icon={<Trash2 />} disabled={busyId === account.id || ownAccount} onClick={() => void remove(account)} /></div></td></tr>;
      })}{!filtered.length && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Không có tài khoản phù hợp.</td></tr>}</tbody></table></div>}

    {form && <AccountDialog form={form} editing={Boolean(editingId)} busy={Boolean(busyId)} onChange={setForm} onClose={() => { setForm(null); setEditingId(null); }} onSubmit={save} />}
  </>;
}

function AccountDialog({ form, editing, busy, onChange, onClose, onSubmit }: { form: AccountFormValues; editing: boolean; busy: boolean; onChange: (value: AccountFormValues) => void; onClose: () => void; onSubmit: (event: FormEvent) => void }) {
  const toggleRole = (role: AppRole) => onChange({ ...form, roles: form.roles.includes(role) ? form.roles.filter((item) => item !== role) : [...form.roles, role] });
  return <div className="fixed inset-0 z-[100] overflow-y-auto p-4"><form onSubmit={onSubmit} className="mx-auto my-6 max-w-2xl rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-black">{editing ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản'}</h2><p className="mt-1 text-xs text-slate-500">Email là tên đăng nhập. Một tài khoản có thể có nhiều vai trò.</p></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100" aria-label="Đóng"><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Họ và tên"><input required minLength={2} maxLength={100} autoComplete="name" className="booking-input" value={form.fullName} onChange={(event) => onChange({ ...form, fullName: event.target.value })} /></Field><Field label="Email đăng nhập"><input required type="email" autoComplete="email" className="booking-input" value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} /></Field><Field label="Số điện thoại"><input required type="tel" inputMode="tel" autoComplete="tel" placeholder="0912 345 678" className="booking-input" value={form.phone} onChange={(event) => onChange({ ...form, phone: event.target.value })} /></Field>{!editing && <Field label="Mật khẩu tạm thời"><input required type="password" minLength={8} autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" className="booking-input" value={form.password || ''} onChange={(event) => onChange({ ...form, password: event.target.value })} /></Field>}<fieldset className="sm:col-span-2"><legend className="text-xs font-bold">Vai trò</legend><div className="mt-2 grid gap-2 sm:grid-cols-3">{ACCOUNT_ROLES.map((role) => <label key={role} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-sky-200 px-3 text-sm font-bold"><input type="checkbox" checked={form.roles.includes(role)} onChange={() => toggleRole(role)} className="h-4 w-4 accent-amber-500" />{ACCOUNT_ROLE_LABELS[role]}</label>)}</div></fieldset></div><button disabled={busy || !form.roles.length} className="sky-button mt-6 min-h-12 w-full rounded-xl disabled:cursor-wait disabled:opacity-60">{busy ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Tạo tài khoản'}</button></form></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="mb-1 block text-xs font-bold">{label}</span>{children}</label>; }
function ActionButton({ label, icon, danger, disabled, onClick }: { label: string; icon: React.ReactNode; danger?: boolean; disabled: boolean; onClick: () => void }) { return <button type="button" title={label} aria-label={label} disabled={disabled} onClick={onClick} className={`grid h-10 w-10 place-items-center rounded-xl border disabled:cursor-not-allowed disabled:opacity-35 [&>svg]:h-4 [&>svg]:w-4 ${danger ? 'border-rose-300 text-rose-700 hover:bg-rose-50' : 'border-sky-200 text-sky-700 hover:bg-sky-50'}`}>{icon}</button>; }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Chưa đăng nhập'; }
function getErrorMessage(error: unknown) { return error instanceof Error ? error.message : 'Không thể thực hiện thao tác. Vui lòng thử lại.'; }
async function readPayload<T>(response: Response): Promise<T> { const payload = await response.json() as T & { error?: string }; if (!response.ok) throw new Error(payload.error || 'Yêu cầu không thành công.'); return payload; }

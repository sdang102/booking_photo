'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AppRole, UserProfile } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { hasRole, normalizeRoles, rolesFromAuthMetadata } from '@/lib/auth/permissions';
import { normalizeVietnameseMobile, VIETNAMESE_MOBILE_ERROR } from '@/lib/phone';

interface AuthResult { success: boolean; roles?: AppRole[]; message?: string; requiresEmailConfirmation?: boolean }
interface AuthContextType {
  user: UserProfile | null;
  isAdmin: boolean;
  isPhotographer: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<AuthResult>;
  register: (email: string, password: string, fullName: string, phone: string) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  updateProfile: (fullName: string, email: string, phone: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const PROFILE_CACHE_MS = 5_000;
let profileCache: { userId: string; value: UserProfile; expiresAt: number } | null = null;
let profileRequest: { userId: string; value: Promise<UserProfile> } | null = null;

function authErrorMessage(error?: { message?: string; code?: string }) {
  const message = error?.message || '';
  const value = message.toLowerCase();
  const code = error?.code || '';

  if (code === 'email_not_confirmed' || value.includes('email not confirmed')) return 'Tài khoản đã đăng ký nhưng email chưa được xác nhận. Hãy mở email và bấm liên kết xác nhận rồi đăng nhập lại.';
  if (code === 'invalid_credentials' || value.includes('invalid login credentials')) return 'Email hoặc mật khẩu không đúng.';
  if (code === 'email_exists' || code === 'user_already_exists' || value.includes('already registered') || value.includes('already exists')) return 'Email này đã được đăng ký. Hãy chuyển sang đăng nhập.';
  if (code === 'email_address_not_authorized' || value.includes('email address not authorized')) return 'Supabase chưa cho phép gửi thư xác nhận tới email này. Quản trị viên cần cấu hình Custom SMTP hoặc tắt Confirm email trong Supabase.';
  if (code === 'over_email_send_rate_limit') return 'Supabase đang giới hạn email xác nhận. Nếu muốn đăng ký và dùng ngay, hãy tắt Confirm email trong Supabase.';
  if (code === 'over_request_rate_limit' || value.includes('rate limit')) return 'Đã gửi quá nhiều yêu cầu. Vui lòng đợi một lúc rồi thử lại.';
  if (code === 'signup_disabled') return 'Chức năng đăng ký tài khoản đang bị tắt trên Supabase.';
  if (code === 'email_provider_disabled') return 'Đăng ký bằng email đang bị tắt trên Supabase.';
  if (code === 'weak_password' || value.includes('password')) return 'Mật khẩu chưa hợp lệ. Vui lòng dùng ít nhất 6 ký tự.';
  if (code === 'email_address_invalid' || (value.includes('email') && value.includes('invalid'))) return 'Địa chỉ email chưa hợp lệ.';
  return message || 'Không thể xác thực tài khoản. Vui lòng thử lại.';
}

async function profileFromSupabase(authUser: { id:string; email?:string; user_metadata?:Record<string,unknown>; app_metadata?:Record<string,unknown> }): Promise<UserProfile> {
  if (profileCache?.userId === authUser.id && profileCache.expiresAt > Date.now()) return profileCache.value;
  if (profileRequest?.userId === authUser.id) return profileRequest.value;

  const request = (async () => {
    const supabase = createClient();
    const { data: contextData, error: contextError } = await supabase.rpc('get_current_user_context');
    const contextRow = Array.isArray(contextData) ? contextData[0] : contextData;
    let profile: UserProfile;

    if (!contextError && contextRow) {
      const row = contextRow as Record<string, unknown>;
      profile = {
        id: authUser.id,
        email: authUser.email || String(row.email || ''),
        full_name: String(row.full_name || authUser.user_metadata?.full_name || 'Khách hàng'),
        phone: String(row.phone || authUser.user_metadata?.phone || ''),
        roles: normalizeRoles(row.roles),
      };
    } else {
      // Backward-compatible while the Phase 1 migration is waiting to be applied.
      const [{ data }, { data: isAdmin }, { data: isPhotographer }] = await Promise.all([
        supabase.from('profiles').select('full_name,email,phone').eq('id', authUser.id).maybeSingle(),
        supabase.rpc('has_role', { required_role: 'admin' }),
        supabase.rpc('has_role', { required_role: 'photographer' }),
      ]);
      const dbRoles: AppRole[] = [isAdmin && 'admin', isPhotographer && 'photographer'].filter((role): role is AppRole => Boolean(role));
      profile = { id:authUser.id,email:authUser.email || data?.email || '',full_name:data?.full_name || String(authUser.user_metadata?.full_name || 'Khách hàng'),phone:data?.phone || String(authUser.user_metadata?.phone || ''),roles:dbRoles.length?normalizeRoles(dbRoles):rolesFromAuthMetadata(authUser.app_metadata,authUser.user_metadata) };
    }
    profileCache = { userId: authUser.id, value: profile, expiresAt: Date.now() + PROFILE_CACHE_MS };
    return profile;
  })();

  profileRequest = { userId: authUser.id, value: request };
  try {
    return await request;
  } finally {
    if (profileRequest?.value === request) profileRequest = null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let syncId = 0;
    const supabase = createClient();

    const syncUser = async (authUser: Parameters<typeof profileFromSupabase>[0] | null) => {
      const currentSyncId = ++syncId;
      if (!authUser) {
        profileCache = null;
        if (active) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const profile = await profileFromSupabase(authUser);
        if (!active || currentSyncId !== syncId) return;
        setUser(profile);
      } catch {
        if (!active || currentSyncId !== syncId) return;
        setUser(null);
      } finally {
        if (active && currentSyncId === syncId) setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Keep the callback synchronous; profile loading uses the same client and
      // must run after Supabase finishes publishing the auth event.
      window.setTimeout(() => void syncUser(session?.user ?? null), 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password = ''): Promise<AuthResult> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error || !data.user) { setIsLoading(false); return { success:false, message:authErrorMessage(error ?? undefined) }; }
      const profile = await profileFromSupabase(data.user);
      setUser(profile); setIsLoading(false);
      return { success:true, roles:profile.roles };
    } catch (error) {
      setIsLoading(false);
      return { success:false, message:authErrorMessage(error instanceof Error ? error : undefined) };
    }
  };

  const register = async (email: string, password: string, fullName: string, phone: string): Promise<AuthResult> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = normalizeVietnameseMobile(phone);
    if (!cleanPhone) {
      setIsLoading(false);
      return { success:false, message:VIETNAMESE_MOBILE_ERROR };
    }
    if (password.length < 8) {
      setIsLoading(false);
      return { success:false, message:'Mật khẩu đăng ký cần có ít nhất 8 ký tự.' };
    }
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password, options: { data: { full_name: fullName.trim(), phone:cleanPhone }, emailRedirectTo:`${window.location.origin}/login?confirmed=1` } });
      if (error || !data.user) {
        setIsLoading(false);
        return { success: false, message: authErrorMessage(error ?? undefined) };
      }
      if (Array.isArray(data.user.identities) && data.user.identities.length === 0) { setIsLoading(false); return { success:false, message:'Email này đã được đăng ký. Hãy chuyển sang đăng nhập.' }; }
      const profile: UserProfile = { id:data.user.id, email:cleanEmail, full_name:fullName.trim(), phone:cleanPhone, roles:['user'] };
      if (data.session) {
        const databaseProfile = await profileFromSupabase(data.user);
        setUser(databaseProfile);
      }
      setIsLoading(false);
      return { success:true, roles:profile.roles, requiresEmailConfirmation:!data.session, message:data.session ? 'Đăng ký thành công.' : 'Đã tạo tài khoản. Supabase vừa gửi email xác nhận; hãy bấm liên kết trong email rồi đăng nhập.' };
    } catch {
      setIsLoading(false);
      return { success:false, message:'Không thể kết nối Supabase. Vui lòng thử lại.' };
    }
  };

  const logout = async () => {
    try { await createClient().auth.signOut(); } catch { /* Local logout still succeeds. */ }
    profileCache = null; profileRequest = null; setUser(null);
  };

  const resendConfirmation = async (email: string): Promise<AuthResult> => {
    const cleanEmail=email.trim().toLowerCase();
    if(!cleanEmail)return{success:false,message:'Hãy nhập email cần xác nhận.'};
    try{
      const{error}=await createClient().auth.resend({type:'signup',email:cleanEmail,options:{emailRedirectTo:`${window.location.origin}/login?confirmed=1`}});
      return error?{success:false,message:authErrorMessage(error)}:{success:true,message:'Đã gửi lại email xác nhận. Hãy kiểm tra cả hộp thư Spam.'};
    }catch{return{success:false,message:'Không thể gửi lại email xác nhận lúc này.'}}
  };

  const updateProfile = async (fullName: string, email: string, phone: string): Promise<AuthResult> => {
    if (!user) return { success:false, message:'Vui lòng đăng nhập lại để cập nhật hồ sơ.' };
    const cleanName=fullName.trim();
    const cleanEmail=email.trim().toLowerCase();
    const cleanPhone=normalizeVietnameseMobile(phone);
    if(!cleanName)return{success:false,message:'Vui lòng nhập họ và tên.'};
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))return{success:false,message:'Vui lòng nhập email hợp lệ.'};
    if(!cleanPhone)return{success:false,message:VIETNAMESE_MOBILE_ERROR};
    try{
      const supabase=createClient();
      const authChanges:{email?:string;data:{full_name:string;phone:string}}={data:{full_name:cleanName,phone:cleanPhone}};
      if(cleanEmail!==user.email.toLowerCase())authChanges.email=cleanEmail;
      const{data:authData,error:authError}=await supabase.auth.updateUser(authChanges);
      if(authError)return{success:false,message:authErrorMessage(authError)};
      const effectiveEmail=authData.user?.email?.toLowerCase()||user.email;
      const{error:profileError}=await supabase.from('profiles').update({full_name:cleanName,email:cleanEmail,phone:cleanPhone}).eq('id',user.id);
      if(profileError)return{success:false,message:profileError.message||'Không thể lưu hồ sơ.'};
      const nextUser={...user,full_name:cleanName,email:effectiveEmail,phone:cleanPhone};
      setUser(nextUser);
      profileCache={userId:user.id,value:nextUser,expiresAt:Date.now()+PROFILE_CACHE_MS};
      const emailPending=cleanEmail!==effectiveEmail;
      return{success:true,message:emailPending?'Đã lưu tên và số điện thoại. Hãy mở email mới để xác nhận thay đổi địa chỉ email.':'Đã cập nhật hồ sơ thành công.'};
    }catch(error){
      return{success:false,message:authErrorMessage(error instanceof Error?error:undefined)};
    }
  };

  const value = { user, isAdmin: hasRole(user, 'admin'), isPhotographer: hasRole(user, 'photographer'), isLoading, login, register, resendConfirmation, updateProfile, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

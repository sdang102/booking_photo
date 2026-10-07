'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Cog, HelpCircle, ImageIcon, LayoutDashboard, MessageSquare, Package, Tags } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import BrandLogo from '@/components/BrandLogo';
import LogoutButton from '@/components/LogoutButton';
import { useAuth } from '@/lib/context/AuthContext';

const NAV=[
  {href:'/admin',label:'Tổng quan',icon:LayoutDashboard,exact:true},
  {href:'/admin/services',label:'Gói chụp',icon:Package},
  {href:'/admin/addons',label:'Dịch vụ bổ sung',icon:Package},
  {href:'/admin/categories',label:'Danh mục',icon:Tags},
  {href:'/admin/albums',label:'Albums',icon:ImageIcon},
  {href:'/admin/faq',label:'FAQ',icon:HelpCircle},
  {href:'/admin/reviews',label:'Đánh giá',icon:MessageSquare},
  {href:'/admin/revenue',label:'Doanh thu',icon:BarChart3},
  {href:'/admin/settings',label:'Cài đặt',icon:Cog},
];

export default function AdminShell({children}:{children:React.ReactNode}){
  const path=usePathname();
  const {user}=useAuth();
  const current=NAV.find(({href,exact})=>exact?path===href:path===href||path.startsWith(`${href}/`))??NAV[0];

  return <RoleGuard allow={['admin']}>
    <div className="workspace-shell workspace-shell--admin">
      <header className="workspace-header">
        <div className="workspace-header__brand">
          <BrandLogo compact/>
          <span className="workspace-header__divider"/>
          <div className="workspace-header__context">
            <span>Không gian quản trị</span>
            <strong>{current.label}</strong>
          </div>
        </div>
        <div className="workspace-header__account">
          <div className="workspace-user-copy">
            <span>Quản trị viên</span>
            <strong>{user?.full_name||'Admin'}</strong>
          </div>
          <LogoutButton label="Đăng xuất"/>
        </div>
      </header>
      <div className="workspace-layout">
        <aside className="workspace-sidebar">
          <div className="workspace-sidebar__intro">
            <span>FIN PHOTO</span>
            <strong>Back office</strong>
            <p>Quản trị nội dung và vận hành website.</p>
          </div>
          <nav className="workspace-nav" aria-label="Điều hướng quản trị">
            {NAV.map(({href,label,icon:Icon,exact})=>{
              const active=exact?path===href:path===href||path.startsWith(`${href}/`);
              return <Link key={href} href={href} aria-current={active?'page':undefined} className={active?'is-active':''}>
                <Icon/><span>{label}</span>{active&&<i/>}
              </Link>;
            })}
          </nav>
          <div className="workspace-sidebar__foot"><span>FIN PHOTO</span><p>Editorial photography</p></div>
        </aside>
        <main className="workspace-main">{children}</main>
      </div>
    </div>
  </RoleGuard>;
}

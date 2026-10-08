import AdminShell from '@/components/admin/AdminShell';
import { privateWorkspaceMetadata } from './layout.metadata';

export const metadata = privateWorkspaceMetadata;

export default function AdminLayout({children}:{children:React.ReactNode}){
  return <AdminShell>{children}</AdminShell>;
}

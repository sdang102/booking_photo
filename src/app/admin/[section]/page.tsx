import AdminSectionPage from '@/components/admin/AdminSectionPage';
export default function Page({params}:{params:Promise<{section:string}>}){return <AdminSectionPage params={params}/>}

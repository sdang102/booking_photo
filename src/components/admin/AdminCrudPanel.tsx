'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ImagePlus, Images, Plus, Trash2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { uploadImageFile } from '@/lib/services/imageUploadService';
import { refreshPublicContent } from '@/lib/client/revalidatePublicContent';
import { deletePortfolioAlbum } from '@/lib/services/contentDeletionService';
import { adminErrorMessage, reportError } from '@/lib/reportError';
import { validateAdminPayload } from '@/lib/adminValidation';

type Row=Record<string,unknown>&{id?:string};
type Field={key:string;label:string;kind?:'number'|'textarea'|'checkbox'|'json'|'image'|'category';required?:boolean};
type Config={table:string;fields:Field[];archive?:string;singleton?:boolean;defaults:Record<string,unknown>};
const PAGE_SIZE=25;
const IMAGE_PATH_COLUMNS:Record<string,string>={image_url:'image_path',cover_image:'cover_image_path',cover_image_mobile:'cover_image_mobile_path',logo_url:'logo_path',favicon_url:'favicon_path',og_image_url:'og_image_path'};

const configs:Record<string,Config>={
  homepage:{table:'homepage_sections',archive:'is_visible',defaults:{content:{},is_visible:true,display_order:0},fields:[{key:'section_key',label:'Mã khối nội dung',required:true},{key:'title',label:'Tiêu đề'},{key:'subtitle',label:'Mô tả',kind:'textarea'},{key:'image_url',label:'Ảnh hiển thị',kind:'image'},{key:'is_visible',label:'Hiển thị',kind:'checkbox'},{key:'display_order',label:'Thứ tự',kind:'number'}]},
  services:{table:'services',archive:'is_active',defaults:{price:0,deposit_amount:0,duration_minutes:120,location_count:0,outfit_count:0,features:[],is_active:true,is_featured:false,display_order:0},fields:[{key:'category_id',label:'Danh mục',kind:'category'},{key:'name',label:'Tên gói',required:true},{key:'slug',label:'Slug',required:true},{key:'short_description',label:'Mô tả ngắn',kind:'textarea'},{key:'description',label:'Mô tả đầy đủ',kind:'textarea'},{key:'price',label:'Giá',kind:'number',required:true},{key:'duration_minutes',label:'Thời lượng (phút)',kind:'number',required:true},{key:'location_count',label:'Số địa điểm',kind:'number'},{key:'outfit_count',label:'Số trang phục',kind:'number'},{key:'edited_photo_count',label:'Số ảnh chỉnh',kind:'number'},{key:'cover_image',label:'Ảnh gói chụp',kind:'image'},{key:'features',label:'Quyền lợi (JSON)',kind:'json'},{key:'terms',label:'Điều khoản',kind:'textarea'},{key:'is_featured',label:'Nổi bật',kind:'checkbox'},{key:'is_active',label:'Hoạt động',kind:'checkbox'},{key:'display_order',label:'Thứ tự',kind:'number'}]},
  addons:{table:'service_addons',archive:'is_active',defaults:{price:0,is_active:true,display_order:0},fields:[{key:'title',label:'Tên dịch vụ bổ sung',required:true},{key:'description',label:'Mô tả',kind:'textarea'},{key:'price',label:'Giá',kind:'number',required:true},{key:'price_label',label:'Cách hiển thị giá'},{key:'is_active',label:'Hoạt động',kind:'checkbox'},{key:'display_order',label:'Thứ tự',kind:'number'}]},
  categories:{table:'categories',archive:'is_active',defaults:{is_active:true,display_order:0},fields:[{key:'name',label:'Tên',required:true},{key:'slug',label:'Slug',required:true},{key:'description',label:'Mô tả',kind:'textarea'},{key:'is_active',label:'Hoạt động',kind:'checkbox'},{key:'display_order',label:'Thứ tự',kind:'number'}]},
  albums:{table:'portfolio_albums',archive:'is_public',defaults:{is_public:true,is_featured:false,display_order:0},fields:[{key:'category_id',label:'Bộ lọc / danh mục',kind:'category'},{key:'title',label:'Tên album',required:true},{key:'slug',label:'Slug',required:true},{key:'description',label:'Mô tả',kind:'textarea'},{key:'location_text',label:'Địa điểm'},{key:'shoot_date',label:'Ngày chụp'},{key:'cover_image',label:'Ảnh bìa ngang cho Desktop',kind:'image'},{key:'cover_image_mobile',label:'Ảnh bìa dọc cho Mobile',kind:'image'},{key:'is_featured',label:'Nổi bật',kind:'checkbox'},{key:'is_public',label:'Công khai',kind:'checkbox'},{key:'display_order',label:'Thứ tự',kind:'number'}]},
  locations:{table:'locations',archive:'is_active',defaults:{travel_fee:0,is_active:true,display_order:0},fields:[{key:'name',label:'Tên',required:true},{key:'area',label:'Khu vực'},{key:'address',label:'Địa chỉ'},{key:'description',label:'Mô tả',kind:'textarea'},{key:'cover_image',label:'Ảnh địa điểm',kind:'image'},{key:'travel_fee',label:'Phụ phí',kind:'number'},{key:'is_active',label:'Hoạt động',kind:'checkbox'},{key:'display_order',label:'Thứ tự',kind:'number'}]},
  faq:{table:'faqs',archive:'is_visible',defaults:{is_visible:true,display_order:0},fields:[{key:'question',label:'Câu hỏi',required:true},{key:'answer',label:'Câu trả lời',kind:'textarea',required:true},{key:'is_visible',label:'Hiển thị',kind:'checkbox'},{key:'display_order',label:'Thứ tự',kind:'number'}]},
  settings:{table:'site_settings',singleton:true,defaults:{website_name:'CHON Photo Sai Gon',photographer_name:'',default_deposit:0},fields:[{key:'website_name',label:'Tên website',required:true},{key:'photographer_name',label:'Tên photographer',required:true},{key:'og_image_url',label:'Ảnh chia sẻ mạng xã hội',kind:'image'},{key:'phone',label:'Điện thoại'},{key:'email',label:'Email'},{key:'facebook_url',label:'Facebook'},{key:'instagram_url',label:'Instagram'},{key:'tiktok_url',label:'TikTok'},{key:'threads_url',label:'Threads'},{key:'seo_title',label:'SEO title'},{key:'seo_description',label:'SEO description',kind:'textarea'}]},
};

// Keep the two existing admin routes while sharing one portfolio-album form.
configs.portfolio = configs.albums;

export default function AdminCrudPanel({section}:{section:string}){
  const config=configs[section];
  const[rows,setRows]=useState<Row[]>([]);const[categories,setCategories]=useState<Array<{id:string;name:string}>>([]);const[edit,setEdit]=useState<Row|null>(null);const[msg,setMsg]=useState('');const[deletingId,setDeletingId]=useState('');const[page,setPage]=useState(0);const[hasMore,setHasMore]=useState(false);
  const load=useCallback(async(pageNumber=0)=>{if(!config)return;const columns=['id',...config.fields.map(field=>field.key),config.archive].filter((value,index,list):value is string=>Boolean(value)&&list.indexOf(value)===index).join(',');let query=createClient().from(config.table).select(columns).order('display_order',{ascending:true});query=config.singleton?query.limit(1):query.range(pageNumber*PAGE_SIZE,(pageNumber+1)*PAGE_SIZE-1);const{data,error}=await query;if(error)setMsg(friendlyDatabaseError(error));else{const next=(data??[])as unknown as Row[];setRows(current=>pageNumber===0?next:[...current,...next]);setPage(pageNumber);setHasMore(!config.singleton&&next.length===PAGE_SIZE)}},[config]);
  useEffect(()=>{void load()},[load]);
  useEffect(()=>{if(config?.fields.some(field=>field.kind==='category'))void createClient().from('categories').select('id,name').eq('is_active',true).order('display_order').then(({data})=>setCategories(data??[]))},[config]);
  if(!config)return null;

  const save=async(event:FormEvent)=>{
    event.preventDefault();if(!edit)return;setMsg('');
    const payload={...edit};delete payload.id;
    for(const field of config.fields){
      if(field.kind==='json'&&typeof payload[field.key]==='string'){
        try{payload[field.key]=JSON.parse(payload[field.key] as string)}catch{return setMsg(`${field.label}: JSON không hợp lệ`)}
      }
    }
    const validationError=validateAdminPayload(config.table,payload);
    if(validationError)return setMsg(validationError);
    const query=edit.id?createClient().from(config.table).update(payload).eq('id',edit.id):createClient().from(config.table).insert(payload);
    const{error}=await query;
    if(error)setMsg(friendlyDatabaseError(error));else{setEdit(null);await load(0);try{await refreshPublicContent();setMsg('Đã lưu nội dung.')}catch(refreshError){setMsg(refreshError instanceof Error?refreshError.message:'Đã lưu nhưng chưa thể làm mới nội dung công khai.')}}
  };
  const archive=async(row:Row)=>{if(!config.archive||!row.id)return;const hidden=row[config.archive]===false;const action=hidden?'hiện lại':'ẩn/ngừng sử dụng';if(!confirm(`Bạn chắc chắn muốn ${action} “${rowLabel(row)}”?`))return;setMsg('');const{error}=await createClient().from(config.table).update({[config.archive]:hidden}).eq('id',row.id);if(error)setMsg(friendlyDatabaseError(error));else{await load(0);try{await refreshPublicContent();setMsg(hidden?'Đã hiện lại mục này.':'Đã ẩn mục này.')}catch(refreshError){setMsg(refreshError instanceof Error?refreshError.message:'Đã lưu nhưng chưa thể làm mới nội dung công khai.')}}};
  const remove=async(row:Row)=>{
    if(!row.id||config.singleton)return;
    const label=rowLabel(row);
    if(!confirm(`Xóa vĩnh viễn “${label}”?\n\nThao tác này không thể hoàn tác. Nếu mục đang được booking hoặc nội dung khác sử dụng, hệ thống sẽ từ chối xóa.`))return;
    setMsg('');setDeletingId(row.id);
    try{
      const client=createClient();
      let cleanupWarning='';
      if(config.table==='portfolio_albums'){
        cleanupWarning=(await deletePortfolioAlbum(row.id)).cleanupWarning??'';
      }else{
        const{error}=await client.from(config.table).delete().eq('id',row.id);
        if(error)throw error;
      }
      setRows(current=>current.filter(item=>item.id!==row.id));
      try{await refreshPublicContent();setMsg(cleanupWarning||`Đã xóa vĩnh viễn “${label}”.`)}
      catch(refreshError){setMsg(`${cleanupWarning||`Đã xóa vĩnh viễn “${label}”.`} ${refreshError instanceof Error?refreshError.message:'Nội dung công khai chưa được làm mới.'}`)}
    }catch(error){setMsg(friendlyDatabaseError(error))}
    finally{setDeletingId('')}
  };
  const openNew=()=>setEdit({id:'',...config.defaults});

  return <div>
    <div className="flex justify-end"><button onClick={()=>config.singleton&&rows[0]?setEdit({...rows[0]}):openNew()} className="sky-button flex min-h-11 items-center gap-2 rounded-xl px-4"><Plus className="h-4 w-4"/>{config.singleton&&rows.length?'Sửa cài đặt':'Thêm mới'}</button></div>
    {msg&&<p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{msg}</p>}
    <div className="mt-5 space-y-3">{rows.map(row=>{const hidden=Boolean(config.archive&&row[config.archive]===false);const managesImages=['albums','portfolio'].includes(section)&&row.id;return <article key={row.id} className={`flex items-center justify-between gap-4 rounded-2xl border bg-white p-4 ${hidden?'border-slate-200 opacity-70':'border-sky-200'}`}><div className="min-w-0"><strong className="block truncate">{rowLabel(row)}</strong><span className="text-xs text-slate-500">{String(row.slug??row.subtitle??'')}{hidden?' · Đang ẩn':''}</span></div><div className="flex flex-wrap justify-end gap-2">{managesImages&&<Link href={`/admin/albums/${row.id}`} className="flex min-h-10 items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-3 text-xs font-bold text-sky-800"><Images className="h-3.5 w-3.5"/>Quản lý ảnh</Link>}<button onClick={()=>setEdit({...row})} className="min-h-10 rounded-xl border border-sky-200 px-3 text-xs font-bold">Sửa</button>{config.archive&&<button onClick={()=>archive(row)} className={`min-h-10 rounded-xl px-3 text-xs font-bold ${hidden?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700'}`}>{hidden?'Hiện':'Ẩn'}</button>}{!config.singleton&&<button disabled={deletingId===row.id} onClick={()=>remove(row)} className="flex min-h-10 items-center gap-1.5 rounded-xl bg-rose-50 px-3 text-xs font-bold text-rose-700 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5"/>{deletingId===row.id?'Đang xóa…':'Xóa'}</button>}</div></article>})}</div>
    {hasMore&&<button type="button" onClick={()=>void load(page+1)} className="mt-4 min-h-11 w-full rounded-xl border border-sky-300 bg-white text-sm font-bold text-sky-800">Tải thêm</button>}
    {edit&&<div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"><form onSubmit={save} className="mx-auto my-6 max-w-2xl rounded-3xl bg-white p-6 shadow-2xl"><div className="flex justify-between gap-4"><div><h2 className="text-2xl font-black">{edit.id?'Chỉnh sửa':'Thêm mới'}</h2><p className="mt-1 text-xs text-slate-500">Ảnh sẽ được nén WebP và lưu trong Supabase Storage.</p></div><button type="button" onClick={()=>setEdit(null)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100"><X/></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{config.fields.map(field=><FieldEditor key={field.key} section={section} field={field} value={edit[field.key]} categories={categories} onChange={value=>setEdit(current=>current?{...current,[field.key]:value}:current)} onPathChange={path=>setEdit(current=>{const pathKey=IMAGE_PATH_COLUMNS[field.key];return current&&pathKey?{...current,[pathKey]:path}:current})} onError={setMsg}/>)}</div><button className="sky-button mt-6 min-h-12 w-full rounded-xl">Lưu vào Supabase</button></form></div>}
  </div>;
}

function rowLabel(row:Row){return String(row.name??row.title??row.question??row.section_key??row.website_name??'Mục này')}
function friendlyDatabaseError(error:unknown){
  reportError(error,{area:'admin-crud',operation:'database-mutation'});
  const value=error&&typeof error==='object'?error as {code?:string;message?:string}:{};
  if(value.code==='23503')return 'Không thể xóa vì mục này đang được booking hoặc dữ liệu khác sử dụng. Hãy dùng chức năng Ẩn.';
  if(value.code==='42501')return 'Tài khoản hiện tại không có quyền xóa mục này.';
  return adminErrorMessage(error,'Không thể thực hiện thao tác. Vui lòng thử lại.');
}

function FieldEditor({section,field,value,categories,onChange,onPathChange,onError}:{section:string;field:Field;value:unknown;categories:Array<{id:string;name:string}>;onChange:(value:unknown)=>void;onPathChange:(path:string)=>void;onError:(message:string)=>void}){
  if(field.kind==='image')return <ImagePicker label={field.label} value={String(value??'')} bucket={section==='services'?'services':section==='locations'?'locations':section==='albums'||section==='portfolio'?'portfolio':'site-assets'} folder={`cms/${section}`} onChange={onChange} onPathChange={onPathChange} onError={onError}/>;
  if(field.kind==='category')return <label><span className="mb-1 block text-xs font-bold">{field.label}</span><select className="booking-input" value={String(value??'')} onChange={event=>onChange(event.target.value||null)}><option value="">Không phân loại</option>{categories.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>;
  return <label className={field.kind==='textarea'||field.kind==='json'?'sm:col-span-2':''}><span className="mb-1 block text-xs font-bold">{field.label}</span>{field.kind==='checkbox'?<input type="checkbox" checked={Boolean(value)} onChange={event=>onChange(event.target.checked)} className="h-5 w-5 accent-sky-600"/>:field.kind==='textarea'||field.kind==='json'?<textarea required={field.required} className="booking-input min-h-28" value={field.kind==='json'&&typeof value!=='string'?JSON.stringify(value??{},null,2):String(value??'')} onChange={event=>onChange(event.target.value)}/>:<input required={field.required} min={field.kind==='number'?0:undefined} type={field.kind==='number'?'number':'text'} className="booking-input" value={String(value??'')} onChange={event=>onChange(field.kind==='number'?Number(event.target.value):event.target.value)}/>}</label>;
}

function ImagePicker({label,value,bucket,folder,onChange,onPathChange,onError}:{label:string;value:string;bucket:string;folder:string;onChange:(value:string)=>void;onPathChange:(path:string)=>void;onError:(message:string)=>void}){
  const[busy,setBusy]=useState(false);
  const select=async(file?:File)=>{if(!file)return;setBusy(true);onError('');try{const uploaded=await uploadImageFile(file,{bucket,folder});onChange(uploaded.url);onPathChange(uploaded.path)}catch(error){onError(error instanceof Error?error.message:'Không thể upload ảnh vào Storage.')}finally{setBusy(false)}};
  return <div className="sm:col-span-2"><span className="mb-2 block text-xs font-bold">{label}</span>{value&&<div className="relative mb-3 h-52 overflow-hidden rounded-2xl border border-sky-200 bg-slate-50"><Image src={value} alt={`Xem trước ${label}`} fill sizes="(max-width:768px) 100vw, 640px" unoptimized={value.startsWith('data:')} className="object-contain"/><button type="button" onClick={()=>onChange('')} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-xl bg-white/90 text-rose-700 shadow"><Trash2 className="h-4 w-4"/></button></div>}<label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-sky-300 bg-sky-50 px-4 text-sm font-bold text-sky-800 hover:bg-sky-100"><ImagePlus className="h-4 w-4"/>{busy?'Đang upload ảnh…':value?'Chọn ảnh khác từ máy':'Chọn ảnh từ máy'}<input type="file" accept="image/*" disabled={busy} onChange={event=>{void select(event.target.files?.[0]);event.target.value=''}} className="sr-only"/></label></div>;
}

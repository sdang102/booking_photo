'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, use, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ImagePlus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { prepareImage, removeStorageImages, uploadPreparedImage, type PreparedImage } from '@/lib/services/imageUploadService';
import { refreshPublicContent } from '@/lib/client/revalidatePublicContent';

type ImageRow={id:string;image_url:string;storage_path:string|null;thumb_url:string|null;thumb_path:string|null;alt_text:string|null;caption:string|null;width:number|null;height:number|null;display_order:number};
type PendingImage={key:string;name:string;previewUrl:string;prepared:PreparedImage};

function errorMessage(error:unknown){
  if(error instanceof Error)return error.message;
  if(error&&typeof error==='object'){
    const value=error as {message?:unknown;error?:unknown;code?:unknown};
    return [value.message,value.error,value.code].filter(item=>typeof item==='string').join(' · ')||JSON.stringify(error);
  }
  return String(error);
}

export default function AlbumImagesPage({params}:{params:Promise<{id:string}>}){
  const{id}=use(params);
  const[images,setImages]=useState<ImageRow[]>([]),[pending,setPending]=useState<PendingImage[]>([]),[albumTitle,setAlbumTitle]=useState('');
  const[msg,setMsg]=useState(''),[busy,setBusy]=useState(false),[deletingId,setDeletingId]=useState(''),[replacingId,setReplacingId]=useState('');

  const load=useCallback(async()=>{
    const client=createClient();
    const[imageResult,albumResult]=await Promise.all([
      client.from('portfolio_images').select('id,image_url,storage_path,thumb_url,thumb_path,alt_text,caption,width,height,display_order').eq('album_id',id).order('display_order'),
      client.from('portfolio_albums').select('title').eq('id',id).maybeSingle(),
    ]);
    if(imageResult.error&&/thumb_url|thumb_path|column/i.test(imageResult.error.message)){
      const legacy=await client.from('portfolio_images').select('id,image_url,storage_path,alt_text,caption,width,height,display_order').eq('album_id',id).order('display_order');
      if(legacy.error)setMsg(legacy.error.message);else setImages((legacy.data??[]).map((item)=>({...item,thumb_url:null,thumb_path:null})));
    }else if(imageResult.error)setMsg(imageResult.error.message);else setImages(imageResult.data??[]);
    if(albumResult.data)setAlbumTitle(albumResult.data.title);
  },[id]);

  useEffect(()=>{void load()},[load]);
  useEffect(()=>{if(images.length)void refreshPublicContent()},[images]);

  const choose=async(files?:FileList|null)=>{
    const selected=Array.from(files??[]);if(!selected.length)return;
    setBusy(true);setMsg('');const added:PendingImage[]=[];const failed:string[]=[];
    for(const file of selected){
      try{const prepared=await prepareImage(file,{thumbnailDimension:640});const previewUrl=URL.createObjectURL(prepared.thumbnail?.blob??prepared.full.blob);added.push({key:`${file.name}-${file.lastModified}-${Math.random()}`,name:file.name.replace(/\.[^.]+$/,''),previewUrl,prepared})}
      catch(error){failed.push(`${file.name}: ${error instanceof Error?error.message:'Không thể xử lý ảnh.'}`)}
    }
    setPending(current=>[...current,...added]);setBusy(false);
    setMsg(failed.length?`Đã chuẩn bị ${added.length} ảnh. Không xử lý được: ${failed.join('; ')}`:`Đã chuẩn bị ${added.length} ảnh. Bấm “Thêm vào album” để lưu.`);
  };

  const add=async(event:FormEvent)=>{
    event.preventDefault();if(!pending.length)return setMsg('Vui lòng chọn ít nhất một ảnh từ máy.');
    setBusy(true);setMsg('');const client=createClient();const failed:PendingImage[]=[];const errors:string[]=[];let added=0;
    try{
      const results=await Promise.allSettled(pending.map(async(item,index)=>{
        const uploaded=await uploadPreparedImage(item.prepared,item.name,{bucket:'portfolio',folder:`albums/${id}`});
        const{error}=await client.from('portfolio_images').insert({album_id:id,image_url:uploaded.url,storage_path:uploaded.path,thumb_url:uploaded.thumbnailUrl,thumb_path:uploaded.thumbnailPath,width:uploaded.width,height:uploaded.height,alt_text:item.name,display_order:images.length+index});
        if(error){await removeStorageImages('portfolio',[uploaded.path,uploaded.thumbnailPath]);throw new Error(/thumb_url|thumb_path|column/i.test(error.message)?'Hãy chạy migration Phase 2 trước khi thêm ảnh album.':error.message)}
        return item;
      }));
      results.forEach((result,index)=>{if(result.status==='fulfilled'){added++;URL.revokeObjectURL(pending[index].previewUrl)}else{failed.push(pending[index]);errors.push(errorMessage(result.reason))}});
      setPending(failed);await load();
      setMsg(failed.length?`Đã thêm ${added} ảnh; ${failed.length} ảnh chưa lưu được: ${errors[0]??'Vui lòng thử lại.'}`:`Đã thêm ${added} ảnh vào album.`);
    }finally{setBusy(false)}
  };

  const remove=async(row:ImageRow)=>{
    if(!confirm(`Xóa ảnh “${row.alt_text||'không có tiêu đề'}” khỏi album?`))return;
    setDeletingId(row.id);setMsg('');const client=createClient();
    try{await removeStorageImages('portfolio',[row.storage_path,row.thumb_path]);const{error}=await client.from('portfolio_images').delete().eq('id',row.id);if(error)throw error;setImages(current=>current.filter(item=>item.id!==row.id));setMsg('Đã xóa ảnh khỏi album.')}catch(error){setMsg(errorMessage(error))}finally{setDeletingId('')}
  };

  const update=async(row:ImageRow)=>{
    setMsg('');const{error}=await createClient().from('portfolio_images').update({alt_text:row.alt_text,caption:row.caption,display_order:row.display_order}).eq('id',row.id);
    if(error)setMsg(error.message);else{await load();setMsg('Đã lưu thông tin ảnh.')}
  };

  const replace=async(row:ImageRow,file?:File)=>{
    if(!file)return;setReplacingId(row.id);setMsg('');
    try{
      const prepared=await prepareImage(file,{thumbnailDimension:640});const client=createClient();
      const uploaded=await uploadPreparedImage(prepared,file.name,{bucket:'portfolio',folder:`albums/${id}`});
      const{error}=await client.from('portfolio_images').update({image_url:uploaded.url,storage_path:uploaded.path,thumb_url:uploaded.thumbnailUrl,thumb_path:uploaded.thumbnailPath,width:uploaded.width,height:uploaded.height}).eq('id',row.id);
      if(error){await removeStorageImages('portfolio',[uploaded.path,uploaded.thumbnailPath]);setMsg(/thumb_url|thumb_path|column/i.test(error.message)?'Hãy chạy migration Phase 2 trước khi thay ảnh album.':error.message)}else{await removeStorageImages('portfolio',[row.storage_path,row.thumb_path]);setImages(current=>current.map(item=>item.id===row.id?{...item,image_url:uploaded.url,storage_path:uploaded.path,thumb_url:uploaded.thumbnailUrl??null,thumb_path:uploaded.thumbnailPath??null,width:uploaded.width,height:uploaded.height}:item));setMsg('Đã thay ảnh mới.')}
    }catch(error){setMsg(error instanceof Error?error.message:'Không thể thay ảnh.')}finally{setReplacingId('')}
  };

  return <div className="mx-auto max-w-6xl">
    <Link href="/admin/albums" className="font-bold text-sky-700">← Quay lại Albums</Link>
    <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="section-kicker">Album</p><h1 className="mt-2 text-3xl font-black">{albumTitle||'Quản lý ảnh album'}</h1><p className="mt-2 text-sm text-slate-500">Album hiện có {images.length} ảnh. Bạn có thể thêm nhiều ảnh cùng lúc, thay ảnh, sửa thông tin hoặc xóa từng ảnh.</p></div></div>

    <form onSubmit={add} className="mt-6 rounded-2xl border border-sky-200 bg-white p-5">
      {pending.length>0&&<div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{pending.map(item=><article key={item.key} className="relative overflow-hidden rounded-xl border border-sky-100 bg-slate-50"><div className="relative h-32"><Image src={item.previewUrl} alt={item.name} fill unoptimized sizes="200px" className="object-cover"/></div><p className="truncate px-2 py-2 text-[11px] font-semibold" title={item.name}>{item.name}</p><button type="button" onClick={()=>{URL.revokeObjectURL(item.previewUrl);setPending(current=>current.filter(image=>image.key!==item.key))}} aria-label={`Bỏ ${item.name}`} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-rose-700 shadow"><Trash2 className="h-3.5 w-3.5"/></button></article>)}</div>}
      <div className="flex flex-col gap-3 sm:flex-row"><label className="flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-sky-300 bg-sky-50 px-5 text-sm font-bold text-sky-800"><ImagePlus className="h-4 w-4"/>{busy?'Đang xử lý ảnh…':'Chọn nhiều ảnh từ máy'}<input type="file" accept="image/*" multiple disabled={busy} onChange={event=>{void choose(event.target.files);event.target.value=''}} className="sr-only"/></label><button disabled={busy||!pending.length} className="sky-button min-h-12 shrink-0 rounded-xl px-6 disabled:opacity-50">{busy?'Đang lưu…':`Thêm ${pending.length||''} ảnh vào album`}</button></div>
    </form>

    {msg&&<p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">{msg}</p>}
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{images.map((row,index)=><article key={row.id} className="rounded-2xl border border-sky-200 bg-white p-4"><div className="relative h-52 overflow-hidden rounded-xl"><Image src={row.image_url} alt={row.alt_text??''} fill unoptimized={row.image_url.startsWith('data:')} sizes="(max-width:768px) 100vw, 33vw" className="object-cover"/></div><label className="mt-3 block text-xs font-bold">Alt text<input value={row.alt_text??''} onChange={event=>setImages(value=>value.map(item=>item.id===row.id?{...item,alt_text:event.target.value}:item))} placeholder="Mô tả ảnh cho SEO" className="booking-input mt-1"/></label><label className="mt-2 block text-xs font-bold">Chú thích<textarea value={row.caption??''} onChange={event=>setImages(value=>value.map(item=>item.id===row.id?{...item,caption:event.target.value}:item))} placeholder="Chú thích hiển thị" className="booking-input mt-1 min-h-20"/></label><label className="mt-2 block text-xs font-bold">Thứ tự hiển thị<input type="number" min="0" value={row.display_order??index} onChange={event=>setImages(value=>value.map(item=>item.id===row.id?{...item,display_order:Number(event.target.value)}:item))} className="booking-input mt-1"/></label><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={()=>update(row)} className="sky-button flex min-h-10 items-center justify-center gap-2 rounded-xl"><Save className="h-4 w-4"/>Lưu sửa đổi</button><label className="flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-sky-300 text-xs font-bold text-sky-800"><RefreshCw className="h-4 w-4"/>{replacingId===row.id?'Đang thay…':'Thay ảnh'}<input type="file" accept="image/*" disabled={Boolean(replacingId)} onChange={event=>{void replace(row,event.target.files?.[0]);event.target.value=''}} className="sr-only"/></label><button type="button" disabled={deletingId===row.id} onClick={()=>remove(row)} className="col-span-2 flex min-h-10 items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 font-bold text-rose-700 disabled:opacity-50"><Trash2 className="h-4 w-4"/>{deletingId===row.id?'Đang xóa…':'Xóa ảnh khỏi album'}</button></div></article>)}</div>
    {!images.length&&<div className="mt-6 rounded-2xl border border-dashed border-sky-300 bg-white p-10 text-center text-sm text-slate-500">Album chưa có ảnh. Hãy chọn một hoặc nhiều ảnh ở phía trên.</div>}
  </div>;
}

import { createClient } from '@/lib/supabase/client';
import { base64ByteSize, imageFileToBase64 } from '@/lib/imageBase64';

export type MediaCategory='homepage'|'portfolio'|'services'|'locations'|'avatar'|'other';
export interface MediaRecord{id:string;bucket:string;storage_path:string;public_url?:string;filename:string;mime_type?:string;size_bytes?:number;category:MediaCategory;created_at:string}

export async function listMedia(search=''){
  let query=createClient().from('media').select('*').order('created_at',{ascending:false}).limit(100);
  if(search)query=query.ilike('filename',`%${search}%`);
  const{data,error}=await query;if(error)throw error;
  return(data??[])as MediaRecord[];
}

export async function uploadMedia(files:File[],category:MediaCategory){
  const supabase=createClient();const results:MediaRecord[]=[];
  for(const file of files){
    const base64=await imageFileToBase64(file);
    const{data,error}=await supabase.from('media').insert({
      bucket:'database',storage_path:`base64/${crypto.randomUUID()}`,public_url:base64,
      filename:file.name,mime_type:'image/webp',size_bytes:base64ByteSize(base64),category,
      metadata:{source_type:file.type,source_size:file.size,encoding:'base64'},
    }).select().single();
    if(error)throw error;
    results.push(data as MediaRecord);
  }
  return results;
}

export async function deleteMedia(item:MediaRecord){
  const supabase=createClient();
  if(item.bucket!=='database'){
    const used=await Promise.all([
      supabase.from('homepage_sections').select('id').eq('image_url',item.public_url).limit(1),
      supabase.from('services').select('id').eq('cover_image',item.public_url).limit(1),
      supabase.from('portfolio_albums').select('id').eq('cover_image',item.public_url).limit(1),
      supabase.from('portfolio_images').select('id').eq('image_url',item.public_url).limit(1),
      supabase.from('locations').select('id').eq('cover_image',item.public_url).limit(1),
    ]);
    if(used.some(result=>(result.data?.length??0)>0))throw new Error('Ảnh đang được sử dụng. Hãy thay ảnh tại nội dung liên quan trước khi xóa.');
    const{error:storageError}=await supabase.storage.from(item.bucket).remove([item.storage_path]);
    if(storageError)throw storageError;
  }
  const{error}=await supabase.from('media').delete().eq('id',item.id);
  if(error)throw error;
}

const MAX_SOURCE_SIZE=20*1024*1024;
const MAX_DIMENSION=1920;

export async function imageFileToBase64(file:File):Promise<string>{
  if(!file.type.startsWith('image/'))throw new Error('Vui lòng chọn đúng file ảnh.');
  if(file.size>MAX_SOURCE_SIZE)throw new Error('Ảnh gốc không được vượt quá 20MB.');

  const source=await readFile(file);
  const image=await loadImage(source);
  const scale=Math.min(1,MAX_DIMENSION/Math.max(image.naturalWidth,image.naturalHeight));
  const width=Math.max(1,Math.round(image.naturalWidth*scale));
  const height=Math.max(1,Math.round(image.naturalHeight*scale));
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d');
  if(!context)throw new Error('Trình duyệt không thể xử lý ảnh này.');
  context.drawImage(image,0,0,width,height);
  return canvas.toDataURL('image/webp',.84);
}

function readFile(file:File){
  return new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Không thể đọc file ảnh.'));reader.readAsDataURL(file)});
}

function loadImage(source:string){
  return new Promise<HTMLImageElement>((resolve,reject)=>{const image=new window.Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('File ảnh không hợp lệ.'));image.src=source});
}

export function base64ByteSize(value:string){
  const data=value.split(',')[1]??'';
  return Math.round(data.length*3/4);
}

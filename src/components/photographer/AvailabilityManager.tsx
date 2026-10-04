'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, Check, CloudSun, Plus, Sun, Sunset, Trash2 } from 'lucide-react';
import type { AvailabilityBlock, BookingPhotoRecord, BookingStatus } from '@/types';
import { createAvailabilityBlock, getAllBookings, getPhotographerAvailabilityBlocks, removeAvailabilityBlock } from '@/lib/services/bookingService';
import { BOOKING_SHIFTS, rangesOverlap, todayKey } from '@/lib/bookingAvailability';

type ShiftId=(typeof BOOKING_SHIFTS)[number]['id'];

const SHIFT_META:Record<ShiftId,{title:string;description:string;icon:typeof Sun}>={
  morning:{title:'Buổi Sáng',description:'Ánh sáng tự nhiên dịu êm',icon:Sun},
  afternoon:{title:'Buổi Chiều',description:'Ánh sáng khối tương phản sâu',icon:CloudSun},
  evening:{title:'Hoàng Hôn & Tối',description:'Chuyển sắc và đèn nghệ thuật',icon:Sunset},
};
const CONFIRMED_STATUSES=new Set<BookingStatus>(['confirmed','checked_in','shooting','completed']);

export default function AvailabilityManager(){
  const[items,setItems]=useState<BookingPhotoRecord[]>([]);
  const[blocks,setBlocks]=useState<AvailabilityBlock[]>([]);
  const[open,setOpen]=useState(true);
  const[date,setDate]=useState('');
  const[allDay,setAllDay]=useState(false);
  const[selectedShifts,setSelectedShifts]=useState<ShiftId[]>([]);
  const[reason,setReason]=useState<AvailabilityBlock['reason']>('Không nhận lịch');
  const[message,setMessage]=useState<{type:'success'|'error';text:string}|null>(null);
  const[busy,setBusy]=useState(false);
  const[removingId,setRemovingId]=useState('');
  const[removingDay,setRemovingDay]=useState('');

  useEffect(()=>{
    Promise.all([getAllBookings(),getPhotographerAvailabilityBlocks()]).then(([bookingItems,availability])=>{
      setItems(bookingItems);setBlocks(availability);
    });
  },[]);

  const groupedBlocks=Object.groupBy([...blocks].sort((a,b)=>`${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`)),(block)=>block.date);
  const shiftRange=(shiftId:ShiftId)=>BOOKING_SHIFTS.find((shift)=>shift.id===shiftId)?.range??'';
  const shiftIsBlocked=(shiftId:ShiftId)=>Boolean(date)&&blocks.some((block)=>block.date===date&&rangesOverlap(shiftRange(shiftId),`${block.start_time} - ${block.end_time}`));
  const shiftConflict=(shiftId:ShiftId)=>Boolean(date)&&items.find((item)=>item.booking_date===date&&CONFIRMED_STATUSES.has(item.status)&&rangesOverlap(shiftRange(shiftId),item.booking_time));

  const toggleShift=(shiftId:ShiftId)=>{
    const conflict=shiftConflict(shiftId);
    if(conflict){setMessage({type:'error',text:`Không thể chặn ${SHIFT_META[shiftId].title}: khách ${conflict.customer_name} đã có booking được xác nhận trong ca này.`});return}
    if(shiftIsBlocked(shiftId))return;
    setAllDay(false);
    setSelectedShifts((current)=>current.includes(shiftId)?current.filter((id)=>id!==shiftId):[...current,shiftId]);
    setMessage(null);
  };

  const toggleAllDay=()=>{
    const next=!allDay;setAllDay(next);
    setSelectedShifts(next?BOOKING_SHIFTS.map((shift)=>shift.id):[]);
    setMessage(null);
  };

  const submit=async(event:FormEvent)=>{
    event.preventDefault();
    const requested=BOOKING_SHIFTS.filter((shift)=>allDay||selectedShifts.includes(shift.id));
    if(!requested.length){setMessage({type:'error',text:'Vui lòng chọn ít nhất một ca cần chặn.'});return}
    const conflicts=requested.map((shift)=>({shift,booking:shiftConflict(shift.id)})).filter((entry)=>entry.booking);
    if(conflicts.length){
      setMessage({type:'error',text:`Không thể chặn ${conflicts.map(({shift})=>SHIFT_META[shift.id].title).join(', ')} vì đã có booking được xác nhận.`});
      return;
    }
    const missing=requested.filter((shift)=>!shiftIsBlocked(shift.id));
    if(!missing.length){setMessage({type:'error',text:'Các ca đã chọn hiện đã được chặn.'});return}
    const description=`${missing.map((shift)=>SHIFT_META[shift.id].title).join(', ')} ngày ${formatShortDate(date)}`;
    if(!window.confirm(`Bạn có chắc muốn chặn ${description}?\n\nKhách hàng sẽ không thể đặt các ca này.`))return;
    setBusy(true);setMessage(null);
    try{
      const created=await Promise.all(missing.map((shift)=>{
        const[start_time,end_time]=shift.range.split('-').map((value)=>value.trim());
        return createAvailabilityBlock({date,start_time,end_time,reason});
      }));
      setBlocks((current)=>[...created,...current]);
      setMessage({type:'success',text:allDay?'Đã chặn toàn bộ ba ca trong ngày.':`Đã chặn ${created.length} ca đã chọn.`});
      setSelectedShifts([]);setAllDay(false);setDate('');setOpen(false);
    }catch(error){setMessage({type:'error',text:error instanceof Error?error.message:'Không thể chặn lịch. Vui lòng thử lại.'})}
    finally{setBusy(false)}
  };

  const unblock=async(block:AvailabilityBlock)=>{
    if(!window.confirm(`Bạn có chắc muốn gỡ chặn ${blockLabel(block)} ngày ${formatShortDate(block.date)}?\n\nCa này sẽ được mở lại cho khách đặt lịch.`))return;
    setRemovingId(block.id);setMessage(null);
    try{
      await removeAvailabilityBlock(block.id);
      setBlocks((current)=>current.filter((item)=>item.id!==block.id));
      setMessage({type:'success',text:`Đã gỡ chặn ${blockLabel(block)} ngày ${formatShortDate(block.date)}.`});
    }catch(error){setMessage({type:'error',text:error instanceof Error?error.message:'Không thể gỡ chặn lịch.'})}
    finally{setRemovingId('')}
  };

  const unblockDay=async(day:string,dayBlocks:AvailabilityBlock[])=>{
    if(!dayBlocks.length)return;
    if(!window.confirm(`Bạn có chắc muốn gỡ toàn bộ ${dayBlocks.length} ca đang chặn ngày ${formatShortDate(day)}?\n\nTất cả các ca này sẽ được mở lại cho khách đặt lịch.`))return;
    setRemovingDay(day);setMessage(null);
    try{
      await Promise.all(dayBlocks.map((block)=>removeAvailabilityBlock(block.id)));
      const removedIds=new Set(dayBlocks.map((block)=>block.id));
      setBlocks((current)=>current.filter((block)=>!removedIds.has(block.id)));
      setMessage({type:'success',text:`Đã gỡ toàn bộ lịch chặn ngày ${formatShortDate(day)}.`});
    }catch(error){
      setBlocks(await getPhotographerAvailabilityBlocks());
      setMessage({type:'error',text:error instanceof Error?error.message:'Không thể gỡ toàn bộ lịch chặn trong ngày.'});
    }finally{setRemovingDay('')}
  };

  return <>
    <div className="flex items-end justify-between gap-4"><div><p className="section-kicker">Quản lý ngày nghỉ</p><h1 className="mt-2 text-3xl font-black">Chặn lịch</h1><p className="mt-2 text-sm text-slate-500">Khóa từng ca hoặc cả ngày để khách không thể đặt trùng lịch riêng của bạn.</p></div><button type="button" onClick={()=>{setOpen((value)=>!value);setMessage(null)}} className="sky-button flex min-h-12 items-center gap-2 rounded-xl px-4 text-sm"><Plus className="h-4 w-4"/>{open?'Đóng form':'Tạo lịch chặn'}</button></div>

    {message&&<div role="alert" className={`mt-5 flex items-start gap-3 rounded-xl border p-4 text-sm ${message.type==='error'?'border-rose-200 bg-rose-50 text-rose-700':'border-emerald-200 bg-emerald-50 text-emerald-700'}`}><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/><span>{message.text}</span></div>}

    {open&&<form onSubmit={submit} className="mt-5 rounded-2xl border border-sky-200 bg-white p-5 sm:p-6">
      <div className="grid gap-4 md:grid-cols-2"><label><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Ngày cần chặn</span><input className="booking-input" type="date" min={todayKey()} required value={date} onChange={(event)=>{setDate(event.target.value);setSelectedShifts([]);setAllDay(false);setMessage(null)}}/></label><label><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Lý do</span><select className="booking-input" value={reason} onChange={(event)=>setReason(event.target.value as AvailabilityBlock['reason'])}>{['Nghỉ','Việc cá nhân','Không nhận lịch','Khác'].map((value)=><option key={value}>{value}</option>)}</select></label></div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-black">Chọn ca cần chặn</h2><p className="mt-1 text-xs text-slate-500">Ca có booking đã xác nhận sẽ không thể chọn.</p></div><button type="button" onClick={toggleAllDay} className={`flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold ${allDay?'border-rose-400 bg-rose-50 text-rose-700':'border-sky-200 text-slate-600'}`}><span className={`grid h-5 w-5 place-items-center rounded border ${allDay?'border-rose-400 bg-rose-400 text-white':'border-slate-400'}`}>{allDay&&<Check className="h-3.5 w-3.5"/>}</span>Chặn cả ngày</button></div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">{BOOKING_SHIFTS.map((shift)=>{const meta=SHIFT_META[shift.id];const Icon=meta.icon;const blocked=shiftIsBlocked(shift.id);const conflict=shiftConflict(shift.id);const selected=allDay||selectedShifts.includes(shift.id);return <button key={shift.id} type="button" disabled={blocked} onClick={()=>toggleShift(shift.id)} className={`relative min-h-32 rounded-2xl border p-4 text-left transition ${selected?'border-rose-400 bg-rose-50':conflict?'border-rose-300 bg-rose-50':blocked?'border-sky-200 bg-slate-50 opacity-55':'border-sky-200 bg-slate-50 hover:border-rose-400'}`}><div className="flex items-start justify-between gap-3"><Icon className={`h-5 w-5 ${conflict?'text-rose-700':'text-amber-400'}`}/><span className={`grid h-6 w-6 place-items-center rounded-full border ${selected?'border-rose-400 bg-rose-400 text-white':'border-slate-500'}`}>{selected&&<Check className="h-3.5 w-3.5"/>}</span></div><strong className="mt-4 block">{meta.title}</strong><span className={`mt-1 block text-xs ${conflict?'text-rose-700':'text-slate-500'}`}>{shift.range} · {conflict?'Đã có booking xác nhận':blocked?'Đã chặn':meta.description}</span></button>})}</div>
      <button disabled={busy} className="mt-5 min-h-12 w-full rounded-xl border border-rose-500 bg-rose-500 font-bold text-white transition hover:bg-rose-600 disabled:cursor-wait disabled:opacity-60">{busy?'Đang cập nhật lịch…':allDay?'Xác nhận chặn cả ngày':selectedShifts.length?`Xác nhận chặn ${selectedShifts.length} ca`:'Xác nhận chặn lịch'}</button>
    </form>}

    <section className="mt-9"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="section-kicker">Lịch nghỉ</p><h2 className="mt-2 text-xl font-black">Các ca đang chặn</h2></div><span className="text-xs text-slate-500">{blocks.length} mục đang chặn</span></div><div className="mt-4 space-y-5">{Object.entries(groupedBlocks).map(([day,dayBlocks])=><div key={day} className="overflow-hidden rounded-2xl border border-rose-200 bg-white"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-200 bg-rose-50 px-4 py-3"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-rose-700"/><strong>{formatLongDate(day)}</strong></span><button type="button" disabled={removingDay===day} onClick={()=>void unblockDay(day,dayBlocks??[])} className="flex min-h-9 items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 text-xs font-bold text-rose-700 disabled:cursor-wait disabled:opacity-50"><Trash2 className="h-3.5 w-3.5"/>{removingDay===day?'Đang gỡ cả ngày…':'Gỡ chặn cả ngày'}</button></header><div className="divide-y divide-sky-100">{dayBlocks?.map((block)=><div key={block.id} className="flex items-center justify-between gap-4 p-4"><div><strong className="text-sm text-rose-700">{blockLabel(block)}</strong><p className="mt-1 text-xs text-slate-500">{block.reason}</p></div><button type="button" disabled={removingId===block.id||removingDay===day} onClick={()=>void unblock(block)} className="flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5"/>{removingId===block.id?'Đang gỡ…':'Gỡ chặn'}</button></div>)}</div></div>)}{!blocks.length&&<div className="rounded-2xl border border-dashed border-sky-300 bg-white p-8 text-center"><CalendarDays className="mx-auto h-7 w-7 text-amber-400"/><h3 className="mt-3 font-black">Chưa có lịch chặn</h3><p className="mt-1 text-sm text-slate-500">Các ca nghỉ hoặc ngày không nhận lịch sẽ xuất hiện tại đây.</p></div>}</div></section>
  </>;
}

function blockLabel(block:AvailabilityBlock){const range=`${block.start_time.slice(0,5)} - ${block.end_time.slice(0,5)}`;if(block.start_time.slice(0,5)<='08:00'&&block.end_time.slice(0,5)>='20:00')return 'Cả ngày · 3 ca';const shift=BOOKING_SHIFTS.find((item)=>item.range===range);return shift?`${SHIFT_META[shift.id].title} · ${shift.range}`:range}
function formatShortDate(date:string){return date.split('-').reverse().join('/')}
function formatLongDate(date:string){return new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(`${date}T00:00:00`))}

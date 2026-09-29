'use client';

import React from 'react';
import { Photographer } from '@/types';
import { Star, Award, Camera, Check } from 'lucide-react';

interface PhotographerCardProps {
  photographer: Photographer;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export default function PhotographerCard({
  photographer,
  isSelected = false,
  onSelect,
}: PhotographerCardProps) {
  return (
    <div
      onClick={() => onSelect && onSelect(photographer.id)}
      className={`relative rounded-2xl p-6 glass-panel glass-panel-hover transition-all duration-500 border flex flex-col justify-between ${
        isSelected
          ? 'border-sky-500 bg-sky-600/15 shadow-xl shadow-sky-950/40 ring-2 ring-sky-500/50'
          : 'border-sky-200'
      } ${onSelect ? 'cursor-pointer' : ''}`}
    >
      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold shadow-md shadow-sky-950/50">
          <Check className="w-4 h-4" />
        </div>
      )}

      <div>
        {/* Top Info: Avatar & Name */}
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-sky-500/60 shadow-md shrink-0">
            <img
              src={photographer.avatar_url}
              alt={photographer.full_name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              {photographer.full_name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center text-sky-500 text-xs font-semibold">
                <Star className="w-3.5 h-3.5 fill-sky-500 mr-0.5" />
                <span>{photographer.rating}</span>
              </div>
              <span className="text-xs text-slate-600">({photographer.review_count} đánh giá)</span>
            </div>
            <div className="text-xs text-sky-700/80 flex items-center gap-1 mt-0.5">
              <Award className="w-3 h-3 text-sky-400" />
              <span>{photographer.experience_years} năm kinh nghiệm</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="mt-4 text-xs text-slate-700 leading-relaxed">
          {photographer.bio}
        </p>

        {/* Specialties */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {photographer.specialties.map((spec, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 text-[11px] rounded-md bg-white/60 text-slate-700 border border-sky-200 font-medium"
            >
              {spec}
            </span>
          ))}
        </div>
      </div>

      {onSelect && (
        <div className="mt-6 pt-4 border-t border-sky-200 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">Nhiếp ảnh gia tiêu biểu</span>
          <span className={`font-semibold ${isSelected ? 'text-sky-700' : 'text-slate-700'}`}>
            {isSelected ? 'Đã lựa chọn ✓' : 'Bấm để chọn'}
          </span>
        </div>
      )}
    </div>
  );
}


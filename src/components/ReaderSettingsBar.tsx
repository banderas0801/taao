'use client';

import React from 'react';
import Link from 'next/link';
import { ReaderSettings, ReaderTheme, ReaderFont } from '@/types';
import { Minus, Plus, BookOpen, Scroll, Maximize2, Radio, ChevronRight } from 'lucide-react';

interface ReaderSettingsBarProps {
  settings: ReaderSettings;
  onChange: (newSettings: ReaderSettings) => void;
}

export default function ReaderSettingsBar({ settings, onChange }: ReaderSettingsBarProps) {
  const update = (partial: Partial<ReaderSettings>) => {
    onChange({ ...settings, ...partial });
  };

  const handleFontDecrease = () => {
    if (settings.fontSize > 12) {
      update({ fontSize: Math.max(12, settings.fontSize - 2) });
    }
  };

  const handleFontIncrease = () => {
    if (settings.fontSize < 64) {
      update({ fontSize: Math.min(64, settings.fontSize + 2) });
    }
  };

  const themes: { id: ReaderTheme; label: string; bg: string; text: string; border: string }[] = [
    { id: 'sepia', label: 'Vàng giấy', bg: 'bg-[#fbf0d9]', text: 'text-[#2b251b]', border: 'border-[#e0d3b6]' },
    { id: 'light', label: 'Trắng', bg: 'bg-white', text: 'text-neutral-800', border: 'border-neutral-300' },
    { id: 'emerald', label: 'Dịu mắt', bg: 'bg-[#eaf4ec]', text: 'text-[#193a28]', border: 'border-[#bcdbc3]' },
    { id: 'gray', label: 'Xám trầm', bg: 'bg-[#1e293b]', text: 'text-[#cbd5e1]', border: 'border-[#334155]' },
    { id: 'dark', label: 'Huyền thiên', bg: 'bg-[#070a12]', text: 'text-[#e2e8f0]', border: 'border-neutral-800' },
    { id: 'oled', label: 'OLED Đen', bg: 'bg-black', text: 'text-[#e4e4e7]', border: 'border-neutral-800' },
  ];

  return (
    <div className="w-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3.5 sm:p-4 shadow-xl transition-all space-y-3.5">
      {/* Hàng 1: Màu nền & Cách đọc */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Chọn màu nền / Theme êm mắt như sách giấy */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mr-1">
            Chủ đề:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {themes.map((t) => {
              const isActive = settings.theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => update({ theme: t.id })}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border-2 ${t.bg} ${t.text} ${
                    isActive ? 'ring-2 ring-amber-500 border-amber-500 scale-105 shadow-sm' : t.border
                  }`}
                >
                  <span className="w-2 h-2 rounded-full border border-current/30"></span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cách đọc: Cuộn dọc vs Lật trang (LaziBook Style) */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mr-1">
            Cách đọc:
          </span>
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 border border-neutral-200 dark:border-neutral-700 text-xs">
            <button
              onClick={() => update({ readMode: 'scroll' })}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                (settings.readMode || 'scroll') === 'scroll'
                  ? 'bg-white dark:bg-neutral-700 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <Scroll className="w-3.5 h-3.5" />
              <span>Cuộn dọc</span>
            </button>
            <button
              onClick={() => update({ readMode: 'page' })}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                settings.readMode === 'page'
                  ? 'bg-white dark:bg-neutral-700 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Lật trang</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hàng: Giọng đọc AI Sách Nói (Tích hợp liền khối trong cài đặt) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mr-1 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-amber-500" />
            Giọng đọc:
          </span>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'anh-khoi', label: 'Anh Khôi [N] (Bắc)' },
              { id: 'truc-ly', label: 'Trúc Ly [N] (Nam)' },
              { id: 'quang-son', label: 'Quang Sơn [N] (Trung)' },
              { id: 'story-male', label: 'Nam Trầm (Kể chuyện)' },
              { id: 'voice_717f9e7c4a371d668b7dd242', label: 'Ngọc Ngạn (MicroX)' },
            ].map((v) => {
              const isSelected = (settings.voice || 'anh-khoi') === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    update({ voice: v.id });
                    try {
                      localStorage.setItem('bientruyen_tts_voice', v.id);
                      localStorage.setItem('bientruyen_default_voice', v.id);
                    } catch (e) {}
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition border ${
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>

        <Link
          href="/phong-thu"
          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 shrink-0 ml-auto"
        >
          <span>Xem 29 giọng phòng thu</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Hàng 2: Cỡ chữ, Phông chữ, Giãn dòng */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
        {/* Cỡ chữ */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mr-1">
            Cỡ chữ:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 border border-neutral-200 dark:border-neutral-700">
              <button
                onClick={handleFontDecrease}
                disabled={settings.fontSize <= 12}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-40 transition text-neutral-700 dark:text-neutral-300"
                title="Giảm cỡ chữ (tối thiểu 12px)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-2.5 text-xs font-bold text-neutral-900 dark:text-white">
                {settings.fontSize}px
              </span>
              <button
                onClick={handleFontIncrease}
                disabled={settings.fontSize >= 64}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-40 transition text-neutral-700 dark:text-neutral-300"
                title="Tăng cỡ chữ (tối đa 64px)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Presets & Auto Fit */}
            <div className="flex items-center gap-1 flex-wrap">
              {[14, 18, 22, 28, 36, 48, 64].map((size) => (
                <button
                  key={size}
                  onClick={() => update({ fontSize: size })}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition border ${
                    settings.fontSize === size
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            <button
              onClick={() => update({ fontSize: 18, lineHeight: 1.8 })}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition"
              title="Đặt lại cỡ chữ 18px và giãn dòng 1.8 tự động fit chuẩn theo khổ đọc"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Fit chuẩn</span>
            </button>
          </div>
        </div>

        {/* Phông chữ tiếng Việt chuẩn */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mr-1">
            Phông chữ:
          </span>
          <div className="flex flex-wrap items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 border border-neutral-200 dark:border-neutral-700 text-xs gap-1">
            {[
              { id: 'lora' as const, label: 'Lora (Cổ điển)', fontClass: 'font-lora' },
              { id: 'be-vietnam' as const, label: 'Be Vietnam (Hiện đại)', fontClass: 'font-be-vietnam' },
              { id: 'merriweather' as const, label: 'Merriweather (In ấn)', fontClass: 'font-merriweather' },
              { id: 'nunito' as const, label: 'Nunito (Bo tròn)', fontClass: 'font-nunito' },
            ].map((f) => {
              const isSelected =
                settings.fontFamily === f.id ||
                (f.id === 'lora' && settings.fontFamily === 'serif') ||
                (f.id === 'be-vietnam' && settings.fontFamily === 'sans');
              return (
                <button
                  key={f.id}
                  onClick={() => update({ fontFamily: f.id })}
                  className={`px-2.5 py-1 rounded-lg ${f.fontClass} transition ${
                    isSelected
                      ? 'bg-white dark:bg-neutral-700 text-amber-600 dark:text-amber-400 shadow-sm font-bold border border-amber-500/30'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Giãn dòng */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mr-1">
            Giãn dòng:
          </span>
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 border border-neutral-200 dark:border-neutral-700 text-xs">
            {[
              { val: 1.6, label: 'Gọn' },
              { val: 1.8, label: 'Chuẩn' },
              { val: 2.0, label: 'Thoáng' },
            ].map((lh) => (
              <button
                key={lh.val}
                onClick={() => update({ lineHeight: lh.val })}
                className={`px-2.5 py-1 rounded-lg transition ${
                  settings.lineHeight === lh.val
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm font-bold'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {lh.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

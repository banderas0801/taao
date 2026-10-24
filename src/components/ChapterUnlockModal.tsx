'use client';

import React from 'react';
import { Chapter } from '@/types';
import { Lock, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ChapterUnlockModalProps {
  isOpen: boolean;
  chapter: Chapter;
  userCoins: number;
  onClose: () => void;
  onUnlock: () => void;
  onOpenPayment: () => void;
}

export default function ChapterUnlockModal({
  isOpen,
  chapter,
  userCoins,
  onClose,
  onUnlock,
  onOpenPayment,
}: ChapterUnlockModalProps) {
  if (!isOpen) return null;

  const price = chapter.coinPrice || 10;
  const hasEnoughCoins = userCoins >= price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 text-center space-y-4">
        {/* Icon Lock */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            Mở Khóa Chương VIP
          </h3>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
            {chapter.title}
          </p>
        </div>

        {/* Bảng chi phí & Số dư */}
        <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-4 space-y-2 border border-neutral-200 dark:border-neutral-700 text-sm">
          <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-300">
            <span>Giá mở khóa:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{price} Xu</span>
          </div>
          <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-300">
            <span>Số dư của bạn:</span>
            <span className={`font-bold ${hasEnoughCoins ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
              {userCoins} Xu
            </span>
          </div>
          {!hasEnoughCoins && (
            <div className="flex items-center space-x-1.5 text-xs text-rose-500 pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Bạn còn thiếu {price - userCoins} Xu để mở khóa chương này.</span>
            </div>
          )}
        </div>

        {/* Nút bấm hành động */}
        <div className="flex items-center space-x-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            Để sau
          </button>
          {hasEnoughCoins ? (
            <button
              onClick={onUnlock}
              className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-md shadow-amber-500/20 transition flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mở Khóa Ngay</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onOpenPayment();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-bold shadow-md transition flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Nạp Thêm Xu</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Tả Ao Reader Error]:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f7f0e0] dark:bg-[#070a12] text-[#2d2218] dark:text-[#cbd5e1] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#efe5ce]/90 dark:bg-[#0f1422] border border-[#dfd2b5] dark:border-amber-900/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-neutral-900 dark:text-white">
          Chưa thể tải trang đọc sách
        </h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {error?.message && !error.message.includes('Minified React error')
            ? error.message
            : 'Đang có xung đột dữ liệu hoặc dữ liệu sách tự nhập chưa kịp đồng bộ từ bộ nhớ thiết bị.'}
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
          <button
            onClick={() => reset()}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-amber-500/30 flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử tải lại</span>
          </button>
          <Link
            href="/"
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Home className="w-4 h-4" />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { BookOpen, Sparkles, History, Search, CheckCircle2, Clock, Radio, BookMarked } from 'lucide-react';
import PaymentModal from './PaymentModal';
import { getUserCoins, getReadingProgress } from '@/lib/storage';
import { ReadingProgress } from '@/types';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [coins, setCoins] = useState<number>(50);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ReadingProgress[]>([]);
  const [headerSearch, setHeaderSearch] = useState('');

  // Ẩn hoàn toàn Header khi đang ở màn hình đọc chương để tối đa hóa không gian đọc mobile
  const isReadingChapter = Boolean(pathname && pathname.includes('/chuong/'));

  useEffect(() => {
    setCoins(getUserCoins());
    setHistory(getReadingProgress());

    const handleStorage = () => {
      setCoins(getUserCoins());
      setHistory(getReadingProgress());
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (headerSearch.trim()) {
      router.push(`/?q=${encodeURIComponent(headerSearch.trim())}`);
    } else {
      router.push('/');
    }
  };

  if (isReadingChapter) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/90 dark:bg-[#070a12]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo Brand */}
          <Link href="/" className="flex items-center space-x-2 group shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/25 group-hover:scale-105 transition">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center leading-none">
                Tả Ao <span className="text-amber-500 ml-1">Reader</span>
              </span>
              <span className="hidden sm:block text-[10px] font-medium text-neutral-400 mt-0.5">
                Đọc thông vạn quyển, thấu triệt càn khôn
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 text-xs font-bold">
            <Link
              href="/"
              className="px-3 py-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              Tất cả
            </Link>
            <Link
              href="/?status=Hoàn thành"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Hoàn Thành (Full)</span>
            </Link>
            <Link
              href="/?status=Đang ra"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition"
            >
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span>Đang Ra</span>
            </Link>
            <Link
              href="/thu-vien"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-neutral-800 dark:text-neutral-200 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition font-black"
            >
              <BookMarked className="w-3.5 h-3.5 text-amber-500" />
              <span>Thư Viện</span>
            </Link>
            <Link
              href="/phong-thu"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition shadow-sm"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Phòng Thu (29 Giọng)</span>
            </Link>
          </nav>

          {/* Desktop Quick Search */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex flex-1 max-w-xs relative">
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Tìm kiếm truyện, tác giả..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
          </form>

          {/* Action Tools (Tối ưu gọn gàng cho điện thoại, không bao giờ tràn lề) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Quản lý Thư Viện Mobile */}
            <Link
              href="/thu-vien"
              className="p-1.5 sm:p-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition lg:hidden"
              title="Quản lý thư viện sách"
            >
              <BookMarked className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            </Link>

            {/* Phòng Thu Voice Studio Mobile */}
            <Link
              href="/phong-thu"
              className="p-1.5 sm:p-2 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition lg:hidden"
              title="Phòng thu giọng nói (29 giọng Nano)"
            >
              <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>

            {/* Lịch sử đọc */}
            <div className="relative">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-1.5 sm:p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                title="Lịch sử đọc"
              >
                <History className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {showHistory && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Lịch sử đọc gần đây</span>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="text-xs text-neutral-400 hover:text-neutral-600"
                    >
                      Đóng
                    </button>
                  </div>
                  {history.length === 0 ? (
                    <p className="text-xs text-neutral-400 py-4 text-center">Chưa có lịch sử đọc truyện nào.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {history.map((h, i) => (
                        <Link
                          key={i}
                          href={`/truyen/${h.storySlug}/chuong/${h.chapterNumber}`}
                          onClick={() => setShowHistory(false)}
                          className="block p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition text-left"
                        >
                          <div className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                            {h.storyTitle}
                          </div>
                          <div className="text-xs text-amber-600 dark:text-amber-400">
                            Đang đọc: {h.chapterTitle}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Số dư Xu (Bấm trực tiếp để Nạp xu) */}
            <button
              onClick={() => setIsPaymentOpen(true)}
              className="flex items-center bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl px-2 py-1 sm:px-2.5 sm:py-1.5 space-x-1 sm:space-x-1.5 transition active:scale-95"
              title="Số dư Xu - Bấm để nạp"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                {coins} <span className="text-[10px] font-medium opacity-80">Xu</span>
              </span>
              <Sparkles className="w-3 h-3 text-amber-500 ml-0.5" />
            </button>

            {/* Nút Đăng Nhập (Chỉ hiện trên máy tính màn hình lớn để tối ưu chỗ cho mobile & PWA) */}
            <Link
              href="/dang-nhap"
              className="hidden lg:inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      {/* Modal Nạp tiền VietQR */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onBalanceUpdated={(newCoins) => setCoins(newCoins)}
      />
    </>
  );
}

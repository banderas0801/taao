'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Shield, Heart } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  if (pathname && pathname.includes('/chuong/')) {
    return null;
  }

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 mt-16 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-lg font-black tracking-tight text-neutral-900 dark:text-white">
                Tả Ao <span className="text-amber-500 ml-0.5">Reader</span>
              </span>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
              Tả Ao Reader – Đọc thông vạn quyển, thấu triệt càn khôn. Cổng đọc kỳ thư, tiểu thuyết chữ và nghe audio book trực tuyến tối ưu bảo vệ mắt.
            </p>
            <div className="flex items-center space-x-2 text-xs text-neutral-400">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Hệ thống thanh toán bảo mật VietQR NAPAS 24/7</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-200 mb-3">
              Thể loại nổi bật
            </h4>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li><Link href="/" className="hover:text-amber-500 transition">Tiên Hiệp</Link></li>
              <li><Link href="/" className="hover:text-amber-500 transition">Huyền Huyễn</Link></li>
              <li><Link href="/" className="hover:text-amber-500 transition">Đô Thị Dị Năng</Link></li>
              <li><Link href="/" className="hover:text-amber-500 transition">Mạt Thế Trọng Sinh</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-200 mb-3">
              Chính sách & Hỗ trợ
            </h4>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li><Link href="/" className="hover:text-amber-500 transition">Điều khoản sử dụng</Link></li>
              <li><Link href="/" className="hover:text-amber-500 transition">Chính sách bảo mật</Link></li>
              <li><Link href="/" className="hover:text-amber-500 transition">Cơ chế Nạp Xu & Hoàn tiền</Link></li>
              <li><Link href="/" className="hover:text-amber-500 transition">Liên hệ Ban Quản Trị</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400">
          <p>© 2026 Tả Ao Reader. All rights reserved.</p>
          <p className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Xây dựng với</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" />
            <span>dành cho độc giả yêu thích tiểu thuyết.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
